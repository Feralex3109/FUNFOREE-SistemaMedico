import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tab, Tabs, Avatar,
} from "@mui/material";
import { Save, Add, BloodtypeOutlined, Warning } from "@mui/icons-material";
import { getCollection, addDocument, updateDocument } from "../../firebase/firestore";
import { where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { GRAVEDAD_EPISODIO, ZONAS_CORPORALES } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const schema = yup.object({
  patientId: yup.string().required("Seleccione un paciente"),
  fecha: yup.string().required("La fecha es requerida"),
  gravedad: yup.string().required("La gravedad es requerida"),
  zonaAfectada: yup.string().required("La zona afectada es requerida"),
  observaciones: yup.string().required("Las observaciones son requeridas"),
  tratamientoAplicado: yup.string().required("El tratamiento aplicado es requerido"),
  seguimiento: yup.string(),
});

const gravedadColor = (v) => GRAVEDAD_EPISODIO.find((g) => g.value === v)?.color || "default";
const gravedadLabel = (v) => GRAVEDAD_EPISODIO.find((g) => g.value === v)?.label || v;

export default function EpisodesPage() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState(null);
  const defaultPatient = searchParams.get("paciente") || "";

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { patientId: defaultPatient, gravedad: "leve", fecha: new Date().toISOString().substring(0, 10) },
  });

  const load = async () => {
    const [p, e] = await Promise.all([
      getCollection("patients", [where("active", "==", true)]),
      getCollection("episodes", [where("active", "==", true)]),
    ]);
    setPatients(p);
    setEpisodes(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await updateDocument("episodes", editId, data);
      } else {
        await addDocument("episodes", data, currentUser.uid);
      }
      setSuccess("Episodio guardado exitosamente");
      await load();
      reset({ patientId: defaultPatient, gravedad: "leve", fecha: new Date().toISOString().substring(0, 10) });
      setEditId(null);
      setTab(1);
    } catch (e) {
      setError("Error al guardar el episodio");
    } finally {
      setSaving(false);
    }
  };

  const getPatientName = (pid) => {
    const p = patients.find((x) => x.id === pid);
    return p ? `${p.nombre} ${p.apellidos}` : "—";
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={700}>Episodios Hemorrágicos</Typography>
          <Typography variant="body2" color="text.secondary">Registro y seguimiento de eventos hemorrágicos</Typography>
        </Box>
        {episodes.filter((e) => e.gravedad === "grave" || e.gravedad === "muy_grave").length > 0 && (
          <Chip
            icon={<Warning />}
            label={`${episodes.filter((e) => e.gravedad === "grave" || e.gravedad === "muy_grave").length} Episodios graves`}
            color="error"
            variant="filled"
          />
        )}
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label={editId ? "Editar Episodio" : "Registrar Episodio"} icon={<Add />} iconPosition="start" />
          <Tab label={`Historial (${episodes.length})`} icon={<BloodtypeOutlined />} iconPosition="start" />
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
                <Grid item xs={6} md={3}>
                  <TextField label="Fecha del Episodio *" type="date" fullWidth {...register("fecha")} InputLabelProps={{ shrink: true }} error={!!errors.fecha} helperText={errors.fecha?.message} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Controller name="gravedad" control={control} render={({ field }) => (
                    <TextField select label="Gravedad *" fullWidth {...field} error={!!errors.gravedad} helperText={errors.gravedad?.message}>
                      {GRAVEDAD_EPISODIO.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="zonaAfectada" control={control} render={({ field }) => (
                    <TextField select label="Zona Afectada *" fullWidth {...field} error={!!errors.zonaAfectada} helperText={errors.zonaAfectada?.message}>
                      {ZONAS_CORPORALES.map((z) => <MenuItem key={z} value={z}>{z}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Tratamiento Aplicado *" fullWidth {...register("tratamientoAplicado")} error={!!errors.tratamientoAplicado} helperText={errors.tratamientoAplicado?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Observaciones *" fullWidth multiline rows={3} {...register("observaciones")} error={!!errors.observaciones} helperText={errors.observaciones?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Seguimiento" fullWidth multiline rows={3} {...register("seguimiento")} placeholder="Evolución posterior al episodio..." />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => { reset(); setEditId(null); }}>Limpiar</Button>
                    <Button type="submit" variant="contained" color="error" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving}>
                      {editId ? "Actualizar" : "Registrar Episodio"}
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
                    <TableCell>Fecha</TableCell>
                    <TableCell>Gravedad</TableCell>
                    <TableCell>Zona Afectada</TableCell>
                    <TableCell>Tratamiento</TableCell>
                    <TableCell>Observaciones</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {episodes.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay episodios registrados</Typography></TableCell></TableRow>
                  ) : (
                    episodes.map((ep) => (
                      <TableRow key={ep.id} hover sx={{ bgcolor: (ep.gravedad === "grave" || ep.gravedad === "muy_grave") ? "rgba(211,47,47,0.04)" : "transparent" }}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{getPatientName(ep.patientId)}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{ep.fecha}</Typography></TableCell>
                        <TableCell><Chip label={gravedadLabel(ep.gravedad)} size="small" color={gravedadColor(ep.gravedad)} sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell><Typography variant="body2">{ep.zonaAfectada}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.tratamientoAplicado}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.observaciones}</Typography></TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => { reset(ep); setEditId(ep.id); setTab(0); }}>Editar</Button>
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
