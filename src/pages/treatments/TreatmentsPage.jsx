import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tab, Tabs,
} from "@mui/material";
import { Save, Add, Vaccines } from "@mui/icons-material";
import { getCollection, addDocument, updateDocument } from "../../firebase/firestore";
import { where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { TIPOS_TRATAMIENTO } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const schema = yup.object({
  patientId: yup.string().required("Seleccione un paciente"),
  tipo: yup.string().required("El tipo es requerido"),
  medicamento: yup.string().required("El medicamento es requerido"),
  dosis: yup.string().required("La dosis es requerida"),
  frecuencia: yup.string().required("La frecuencia es requerida"),
  fechaInicio: yup.string().required("La fecha de inicio es requerida"),
  fechaFin: yup.string(),
  seguimiento: yup.string(),
  alertas: yup.string(),
});

export default function TreatmentsPage() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState(null);

  const defaultPatient = searchParams.get("paciente") || "";

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { patientId: defaultPatient, tipo: "tratamiento" },
  });

  const load = async () => {
    const [p, t] = await Promise.all([
      getCollection("patients", [where("active", "==", true)]),
      getCollection("treatments", [where("active", "==", true)]),
    ]);
    setPatients(p);
    setTreatments(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await updateDocument("treatments", editId, data);
      } else {
        await addDocument("treatments", data, currentUser.uid);
      }
      setSuccess("Tratamiento guardado exitosamente");
      await load();
      reset({ patientId: defaultPatient, tipo: "tratamiento" });
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
        <Typography variant="h5" fontWeight={700}>Tratamientos y Profilaxis</Typography>
        <Typography variant="body2" color="text.secondary">Gestión de tratamientos médicos y planes de profilaxis</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label={editId ? "Editar Tratamiento" : "Registrar"} icon={<Add />} iconPosition="start" />
          <Tab label={`Historial (${treatments.length})`} icon={<Vaccines />} iconPosition="start" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller name="patientId" control={control} render={({ field }) => (
                    <TextField select label="Paciente *" fullWidth {...field} error={!!errors.patientId} helperText={errors.patientId?.message}>
                      {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre} {p.apellidos} — {p.documento}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="tipo" control={control} render={({ field }) => (
                    <TextField select label="Tipo *" fullWidth {...field} error={!!errors.tipo} helperText={errors.tipo?.message}>
                      {TIPOS_TRATAMIENTO.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Medicamento / Factor *" fullWidth {...register("medicamento")} error={!!errors.medicamento} helperText={errors.medicamento?.message} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Dosis *" fullWidth {...register("dosis")} error={!!errors.dosis} helperText={errors.dosis?.message} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Frecuencia *" fullWidth {...register("frecuencia")} error={!!errors.frecuencia} helperText={errors.frecuencia?.message} placeholder="Ej: Cada 48h" />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Fecha Inicio *" type="date" fullWidth {...register("fechaInicio")} InputLabelProps={{ shrink: true }} error={!!errors.fechaInicio} helperText={errors.fechaInicio?.message} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Fecha Fin" type="date" fullWidth {...register("fechaFin")} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Seguimiento" fullWidth multiline rows={3} {...register("seguimiento")} placeholder="Observaciones de seguimiento..." />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Alertas" fullWidth multiline rows={3} {...register("alertas")} placeholder="Alertas o condiciones especiales..." />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => { reset(); setEditId(null); }}>Limpiar</Button>
                    <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving}>
                      {editId ? "Actualizar" : "Guardar Tratamiento"}
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
                    <TableCell>Tipo</TableCell>
                    <TableCell>Medicamento</TableCell>
                    <TableCell>Dosis / Frecuencia</TableCell>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {treatments.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay tratamientos registrados</Typography></TableCell></TableRow>
                  ) : (
                    treatments.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{getPatientName(t.patientId)}</Typography></TableCell>
                        <TableCell><Chip label={t.tipo} size="small" color={t.tipo === "profilaxis" ? "secondary" : "primary"} /></TableCell>
                        <TableCell>{t.medicamento}</TableCell>
                        <TableCell>{t.dosis} / {t.frecuencia}</TableCell>
                        <TableCell><Typography variant="caption">{t.fechaInicio}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{t.fechaFin || "Indefinido"}</Typography></TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => { reset(t); setEditId(t.id); setTab(0); }}>Editar</Button>
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
