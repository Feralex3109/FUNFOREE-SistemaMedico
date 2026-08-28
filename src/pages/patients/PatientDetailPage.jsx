import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box, Button, Card, CardContent, Typography, Grid, Chip,
  Avatar, Tab, Tabs, CircularProgress, Breadcrumbs, Link as MuiLink,
  Divider, List, ListItem, ListItemText,
} from "@mui/material";
import {
  ArrowBack, Edit, Person, MedicalInformation, Vaccines,
  BloodtypeOutlined, CalendarMonth, Science,
} from "@mui/icons-material";
import { getDocument, getCollection } from "../../firebase/firestore";
import { where } from "firebase/firestore";
import { formatDate, getInitials } from "../../utils/helpers";
import { DIAGNOSTICOS, ESTADOS_PACIENTE } from "../../utils/constants";

const diagLabel = (val) => {
  const match = DIAGNOSTICOS.find((d) => d.value === val);
  if (match) return match.label;
  return val || "Sin diagnóstico";
};
const estadoColor = (val) => ESTADOS_PACIENTE.find((e) => e.value === val)?.color || "default";

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [episodes, setEpisodes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, ep, ap, tr] = await Promise.all([
          getDocument("patients", id),
          getCollection("episodes", [where("patientId", "==", id), where("active", "==", true)]),
          getCollection("appointments", [where("patientId", "==", id), where("active", "==", true)]),
          getCollection("treatments", [where("patientId", "==", id), where("active", "==", true)]),
        ]);
        setPatient(p);
        setEpisodes(ep);
        setAppointments(ap);
        setTreatments(tr);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (!patient) return <Box><Typography>Paciente no encontrado</Typography></Box>;

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component="button" onClick={() => navigate("/pacientes")} underline="hover" color="inherit" sx={{ cursor: "pointer", fontSize: "0.875rem" }}>
            Pacientes
          </MuiLink>
          <Typography color="text.primary" fontSize="0.875rem">
            {patient.nombre} {patient.apellidos}
          </Typography>
        </Breadcrumbs>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate("/pacientes")} variant="outlined" size="small">Volver</Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/pacientes/${id}/editar`)}
          >
            Editar Paciente
          </Button>
        </Box>
      </Box>

      {/* Patient Profile Card */}
      <Card sx={{ mb: 2, background: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)", color: "#fff" }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs="auto">
              <Avatar
                sx={{
                  width: 80, height: 80,
                  bgcolor: "rgba(255,255,255,0.2)",
                  fontSize: "1.8rem", fontWeight: 700, color: "#fff",
                  border: "3px solid rgba(255,255,255,0.4)",
                }}
              >
                {getInitials(`${patient.nombre} ${patient.apellidos}`)}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" fontWeight={700}>{patient.nombre} {patient.apellidos}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>Doc: {patient.documento} · {patient.edad} años · {patient.sexo}</Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip label={diagLabel(patient.diagnostico)} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: "0.75rem" }} size="small" />
                <Chip label={patient.eps} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.75rem" }} size="small" />
                <Chip label={patient.estado?.toUpperCase()} color={estadoColor(patient.estado)} size="small" sx={{ fontWeight: 700 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md="auto">
              <Grid container spacing={2}>
                {[
                  { label: "Episodios", value: episodes.length, icon: <BloodtypeOutlined />, path: `/episodios?paciente=${id}` },
                  { label: "Citas", value: appointments.length, icon: <CalendarMonth />, path: `/citas?paciente=${id}` },
                  { label: "Tratamientos", value: treatments.length, icon: <Vaccines />, path: `/tratamientos?paciente=${id}` },
                ].map((stat) => (
                  <Grid item key={stat.label}>
                    <Box
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2, px: 2, py: 1, textAlign: "center",
                        cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                        transition: "all 0.2s",
                      }}
                      onClick={() => navigate(stat.path)}
                    >
                      <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>{stat.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Datos Personales" icon={<Person />} iconPosition="start" />
          <Tab label="Historia Clínica" icon={<MedicalInformation />} iconPosition="start" onClick={() => navigate(`/historia-clinica?paciente=${id}`)} />
          <Tab label="Episodios" icon={<BloodtypeOutlined />} iconPosition="start" onClick={() => navigate(`/episodios?paciente=${id}`)} />
          <Tab label="Tratamientos" icon={<Vaccines />} iconPosition="start" onClick={() => navigate(`/tratamientos?paciente=${id}`)} />
          <Tab label="Citas" icon={<CalendarMonth />} iconPosition="start" onClick={() => navigate(`/citas?paciente=${id}`)} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tab} index={0}>
            <Grid container spacing={3}>
              {[
                { label: "Documento", value: patient.documento },
                { label: "Nombre Completo", value: `${patient.nombre} ${patient.apellidos}` },
                { label: "Edad", value: `${patient.edad} años` },
                { label: "Sexo", value: patient.sexo },
                { label: "Dirección", value: patient.direccion },
                { label: "Teléfono", value: patient.telefono },
                { label: "EPS", value: patient.eps },
                { label: "Diagnóstico", value: diagLabel(patient.diagnostico) },
                { label: "Estado", value: patient.estado },
                { label: "Registrado", value: formatDate(patient.createdAt) },
              ].map(({ label, value }) => (
                <Grid item xs={12} sm={6} md={4} key={label}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" textTransform="uppercase" letterSpacing="0.05em" fontSize="0.65rem">
                    {label}
                  </Typography>
                  <Typography variant="body1" fontWeight={500} mt={0.3}>{value || "—"}</Typography>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={700} mb={1}>Resumen clínico</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {patient.diagnostico || "Aún no se ha registrado un diagnóstico clínico para este paciente."}
            </Typography>
          </TabPanel>
        </Box>
      </Card>
    </Box>
  );
}
