import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Chip, Stack, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, Paper, Avatar,
} from "@mui/material";
import { Save, Add, CalendarMonth, EventAvailable } from "@mui/icons-material";
import { getCollection, addDocument, updateDocument } from "../../firebase/firestore";
import { where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { ESTADOS_CITA } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const schema = yup.object({
  patientId: yup.string().required("Seleccione un paciente"),
  fecha: yup.string().required("La fecha es requerida"),
  hora: yup.string().required("La hora es requerida"),
  motivo: yup.string().required("El motivo es requerido"),
  estado: yup.string().required("El estado es requerido"),
  asistencia: yup.string(),
  autorizacion: yup.string(),
  notas: yup.string(),
});

const estadoColor = (v) => ESTADOS_CITA.find((e) => e.value === v)?.color || "default";
const estadoLabel = (v) => ESTADOS_CITA.find((e) => e.value === v)?.label || v;

export default function AppointmentsPage() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState(null);
  const [followUpDialog, setFollowUpDialog] = useState({ open: false, appointment: null });
  const [followUpData, setFollowUpData] = useState({ asistencia: "", notas: "" });
  const defaultPatient = searchParams.get("paciente") || "";

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { patientId: defaultPatient, estado: "programada" },
  });

  const load = async () => {
    const [p, a] = await Promise.all([
      getCollection("patients", [where("active", "==", true)]),
      getCollection("appointments", [where("active", "==", true)]),
    ]);
    setPatients(p);
    setAppointments(a);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await updateDocument("appointments", editId, data);
      } else {
        await addDocument("appointments", data, currentUser.uid);
      }
      setSuccess("Cita guardada exitosamente");
      await load();
      reset({ patientId: defaultPatient, estado: "programada" });
      setEditId(null);
      setTab(1);
    } catch (e) {
      setError("Error al guardar la cita");
    } finally {
      setSaving(false);
    }
  };

  const getPatientName = (pid) => {
    const p = patients.find((x) => x.id === pid);
    return p ? `${p.nombre} ${p.apellidos}` : "—";
  };

  const handleFollowUpSave = async () => {
    if (!followUpDialog.appointment) return;
    const appointment = followUpDialog.appointment;
    await updateDocument("appointments", appointment.id, {
      asistencia: followUpData.asistencia || "",
      notas: followUpData.notas || appointment.notas || "",
      estado: followUpData.asistencia === "si" ? "completada" : appointment.estado,
    });
    setFollowUpDialog({ open: false, appointment: null });
    setFollowUpData({ asistencia: "", notas: "" });
    await load();
  };

  // Group appointments by date for calendar view
  const today = new Date().toISOString().substring(0, 10);
  const upcoming = appointments.filter((a) => a.fecha >= today && a.estado !== "cancelada").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pastAppointments = appointments.filter((a) => a.fecha < today).sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestión de Citas</Typography>
          <Typography variant="body2" color="text.secondary">Programación y seguimiento de citas médicas</Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Paper sx={{ px: 2, py: 1, textAlign: "center", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={700} color="primary">{upcoming.length}</Typography>
            <Typography variant="caption" color="text.secondary">Próximas</Typography>
          </Paper>
          <Paper sx={{ px: 2, py: 1, textAlign: "center", borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {appointments.filter((a) => a.estado === "completada").length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Completadas</Typography>
          </Paper>
        </Box>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label={editId ? "Editar Cita" : "Nueva Cita"} icon={<Add />} iconPosition="start" />
          <Tab label={`Próximas (${upcoming.length})`} icon={<EventAvailable />} iconPosition="start" />
          <Tab label="Historial" icon={<CalendarMonth />} iconPosition="start" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Stack spacing={2}>
                <Card variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "grey.50" }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={1}>Datos básicos de la cita</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Controller name="patientId" control={control} render={({ field }) => (
                        <TextField select label="Paciente *" fullWidth {...field} error={!!errors.patientId} helperText={errors.patientId?.message}>
                          {patients.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre} {p.apellidos} — {p.documento}</MenuItem>)}
                        </TextField>
                      )} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField label="Fecha *" type="date" fullWidth {...register("fecha")} InputLabelProps={{ shrink: true }} error={!!errors.fecha} helperText={errors.fecha?.message} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField label="Hora *" type="time" fullWidth {...register("hora")} InputLabelProps={{ shrink: true }} error={!!errors.hora} helperText={errors.hora?.message} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Motivo de la cita *" fullWidth {...register("motivo")} error={!!errors.motivo} helperText={errors.motivo?.message} placeholder="Ejemplo: Seguimiento clínico y revisión de tratamiento" />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Controller name="estado" control={control} render={({ field }) => (
                        <TextField select label="Estado *" fullWidth {...field} error={!!errors.estado} helperText={errors.estado?.message}>
                          {ESTADOS_CITA.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                        </TextField>
                      )} />
                    </Grid>
                  </Grid>
                </Card>

                <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="secondary.main" mb={1}>Información adicional</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField label="Autorización EPS" fullWidth {...register("autorizacion")} placeholder="Número de autorización o referencia" helperText="Opcional, útil para citas con cobertura." />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField label="Notas" fullWidth multiline rows={3} {...register("notas")} placeholder="Observaciones clínicas, recordatorios o indicaciones para el paciente" />
                    </Grid>
                  </Grid>
                </Card>

                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={() => { reset({ patientId: defaultPatient, estado: "programada" }); setEditId(null); }}>Limpiar</Button>
                  <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving}>
                    {editId ? "Actualizar Cita" : "Programar Cita"}
                  </Button>
                </Box>
              </Stack>
            </form>
          )}

          {(tab === 1 || tab === 2) && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Paciente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Asistencia</TableCell>
                    <TableCell>Autorización</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(tab === 1 ? upcoming : pastAppointments).length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay citas en esta sección</Typography></TableCell></TableRow>
                  ) : (
                    (tab === 1 ? upcoming : pastAppointments).map((apt) => (
                      <TableRow key={apt.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.2}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light", color: "primary.main", fontSize: 14 }}>C</Avatar>
                            <Typography variant="body2" fontWeight={600}>{getPatientName(apt.patientId)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2">{apt.fecha}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{apt.hora}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.motivo}</Typography></TableCell>
                        <TableCell><Chip label={estadoLabel(apt.estado)} size="small" color={estadoColor(apt.estado)} sx={{ fontWeight: 600 }} /></TableCell>
                        <TableCell>
                          {apt.asistencia === "si" ? <Chip label="Asistió" size="small" color="success" /> :
                            apt.asistencia === "no" ? <Chip label="No Asistió" size="small" color="error" /> :
                              <Typography variant="caption" color="text.secondary">—</Typography>}
                        </TableCell>
                        <TableCell><Typography variant="caption">{apt.autorizacion || "—"}</Typography></TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button size="small" onClick={() => { reset(apt); setEditId(apt.id); setTab(0); }}>Editar</Button>
                            <Button size="small" variant="outlined" color="secondary" onClick={() => { setFollowUpDialog({ open: true, appointment: apt }); setFollowUpData({ asistencia: apt.asistencia || "", notas: apt.notas || "" }); }}>Seguimiento</Button>
                          </Box>
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

      <Dialog open={followUpDialog.open} onClose={() => setFollowUpDialog({ open: false, appointment: null })} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Seguimiento de cita</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Asistencia"
              value={followUpData.asistencia}
              onChange={(e) => setFollowUpData({ ...followUpData, asistencia: e.target.value })}
            >
              <MenuItem value="">Sin registrar</MenuItem>
              <MenuItem value="si">Asistió</MenuItem>
              <MenuItem value="no">No asistió</MenuItem>
            </TextField>
            <TextField
              label="Novedades de la cita"
              multiline
              rows={4}
              value={followUpData.notas}
              onChange={(e) => setFollowUpData({ ...followUpData, notas: e.target.value })}
              placeholder="Ejemplo: paciente llegó a tiempo, se ajustó el tratamiento o no asistió por motivo de transporte."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFollowUpDialog({ open: false, appointment: null })}>Cancelar</Button>
          <Button variant="contained" onClick={handleFollowUpSave}>Guardar seguimiento</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
