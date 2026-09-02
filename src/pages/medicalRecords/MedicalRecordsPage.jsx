import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Breadcrumbs, Link as MuiLink,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider, Tab, Tabs,
} from "@mui/material";
import { Save, Add, ArrowBack, MedicalInformation } from "@mui/icons-material";
import {
  getCollection, addDocument, updateDocument, getDocument,
} from "../../firebase/firestore";
import { where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";

const schema = yup.object({
  patientId: yup.string().required("Seleccione un paciente"),
  antecedentes: yup.string().required("Los antecedentes son requeridos"),
  diagnostico: yup.string().required("El diagnóstico es requerido"),
  evolucionMedica: yup.string(),
  notasMedicas: yup.string(),
});

export default function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState(null);

  const defaultPatient = searchParams.get("paciente") || "";

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { patientId: defaultPatient },
  });

  useEffect(() => {
    const load = async () => {
      const [p, r] = await Promise.all([
        getCollection("patients", [where("active", "==", true)]),
        getCollection("medicalRecords", [where("active", "==", true)]),
      ]);
      setPatients(p);
      setRecords(r);
      setLoading(false);
    };
    load();
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await updateDocument("medicalRecords", editId, data);
        setSuccess("Historia clínica actualizada");
      } else {
        await addDocument("medicalRecords", data, currentUser.uid);
        setSuccess("Historia clínica registrada");
      }
      const r = await getCollection("medicalRecords", [where("active", "==", true)]);
      setRecords(r);
      reset({ patientId: defaultPatient });
      setEditId(null);
      setTab(1);
    } catch (e) {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const getPatientName = (pid) => {
    const p = patients.find((x) => x.id === pid);
    return p ? `${p.nombre} ${p.apellidos}` : pid;
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Historia Clínica</Typography>
        <Typography variant="body2" color="text.secondary">Registro de antecedentes, diagnósticos y evolución médica</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Registrar / Editar" icon={<Add />} iconPosition="start" />
          <Tab label="Historial" icon={<MedicalInformation />} iconPosition="start" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="patientId"
                    control={control}
                    render={({ field }) => (
                      <TextField select label="Paciente *" fullWidth {...field} error={!!errors.patientId} helperText={errors.patientId?.message}>
                        {patients.map((p) => (
                          <MenuItem key={p.id} value={p.id}>{p.nombre} {p.apellidos} — {p.documento}</MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Antecedentes (familiares, personales, alérgicos) *"
                    fullWidth multiline rows={3}
                    {...register("antecedentes")}
                    error={!!errors.antecedentes}
                    helperText={errors.antecedentes?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Diagnóstico Médico *"
                    fullWidth multiline rows={3}
                    {...register("diagnostico")}
                    error={!!errors.diagnostico}
                    helperText={errors.diagnostico?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Evolución Médica"
                    fullWidth multiline rows={4}
                    {...register("evolucionMedica")}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Notas Médicas"
                    fullWidth multiline rows={4}
                    {...register("notasMedicas")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => { reset(); setEditId(null); }}>Limpiar</Button>
                    <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving}>
                      Guardar
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}

          {tab === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Antecedentes</TableCell>
                    <TableCell>Diagnóstico</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay registros</Typography></TableCell></TableRow>
                  ) : (
                    records.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{getPatientName(r.patientId)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.antecedentes}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.diagnostico}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{formatDate(r.createdAt)}</Typography></TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => { reset(r); setEditId(r.id); setTab(0); }}>Editar</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
