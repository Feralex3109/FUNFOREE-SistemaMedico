import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, IconButton, Tooltip, Link,
} from "@mui/material";
import { Save, Add, Science, Upload, PictureAsPdf, Visibility } from "@mui/icons-material";
import { getCollection, addDocument, updateDocument } from "../../firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";
import { where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";

const schema = yup.object({
  patientId: yup.string().required("Seleccione un paciente"),
  fecha: yup.string().required("La fecha es requerida"),
  tipoExamen: yup.string().required("El tipo de examen es requerido"),
  resultado: yup.string().required("El resultado es requerido"),
  observaciones: yup.string(),
});

const TIPOS_EXAMEN = [
  "Hemograma completo",
  "Factor VIII (actividad)",
  "Factor IX (actividad)",
  "Factor von Willebrand (antígeno)",
  "Factor von Willebrand (actividad)",
  "Tiempo de tromboplastina parcial (aPTT)",
  "Tiempo de protrombina (PT)",
  "Inhibidor Factor VIII",
  "Inhibidor Factor IX",
  "Grupo sanguíneo",
  "Hepatitis B",
  "Hepatitis C",
  "VIH",
  "Otro",
];

export default function LaboratoriesPage() {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileRef = useRef();
  const defaultPatient = searchParams.get("paciente") || "";

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { patientId: defaultPatient, fecha: new Date().toISOString().substring(0, 10) },
  });

  const load = async () => {
    const [p, l] = await Promise.all([
      getCollection("patients", [where("active", "==", true)]),
      getCollection("laboratories", [where("active", "==", true)]),
    ]);
    setPatients(p);
    setLabs(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      let archivoUrl = "";
      if (selectedFile) {
        setUploading(true);
        const storageRef = ref(storage, `laboratories/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        archivoUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }
      const payload = { ...data, archivoUrl };
      if (editId) {
        await updateDocument("laboratories", editId, payload);
      } else {
        await addDocument("laboratories", payload, currentUser.uid);
      }
      setSuccess("Resultado guardado exitosamente");
      await load();
      reset({ patientId: defaultPatient, fecha: new Date().toISOString().substring(0, 10) });
      setEditId(null);
      setSelectedFile(null);
      setTab(1);
    } catch (e) {
      setError("Error al guardar el resultado");
      console.error(e);
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
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Laboratorios y Resultados</Typography>
        <Typography variant="body2" color="text.secondary">Registro y consulta de resultados de laboratorio</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label={editId ? "Editar Resultado" : "Registrar Resultado"} icon={<Add />} iconPosition="start" />
          <Tab label={`Resultados (${labs.length})`} icon={<Science />} iconPosition="start" />
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
                  <TextField label="Fecha del Examen *" type="date" fullWidth {...register("fecha")} InputLabelProps={{ shrink: true }} error={!!errors.fecha} helperText={errors.fecha?.message} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Controller name="tipoExamen" control={control} render={({ field }) => (
                    <TextField select label="Tipo de Examen *" fullWidth {...field} error={!!errors.tipoExamen} helperText={errors.tipoExamen?.message}>
                      {TIPOS_EXAMEN.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Resultado *" fullWidth multiline rows={3} {...register("resultado")} error={!!errors.resultado} helperText={errors.resultado?.message} placeholder="Valores obtenidos..." />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Observaciones" fullWidth multiline rows={3} {...register("observaciones")} placeholder="Notas adicionales del médico..." />
                </Grid>
                <Grid item xs={12}>
                  <Box
                    onClick={() => fileRef.current?.click()}
                    sx={{
                      border: "2px dashed",
                      borderColor: selectedFile ? "success.main" : "divider",
                      borderRadius: 2,
                      p: 2.5,
                      textAlign: "center",
                      cursor: "pointer",
                      bgcolor: selectedFile ? "success.50" : "background.default",
                      transition: "all 0.2s",
                      "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
                    }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf"
                      hidden
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    />
                    <PictureAsPdf sx={{ fontSize: 32, color: selectedFile ? "success.main" : "text.disabled", mb: 1 }} />
                    <Typography variant="body2" fontWeight={600}>
                      {selectedFile ? selectedFile.name : "Adjuntar resultado PDF"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Haz clic para seleccionar un archivo PDF</Typography>
                    {uploading && <CircularProgress size={20} sx={{ mt: 1 }} />}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => { reset(); setEditId(null); setSelectedFile(null); }}>Limpiar</Button>
                    <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving || uploading}>
                      {editId ? "Actualizar" : "Guardar Resultado"}
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
                    <TableCell>Tipo de Examen</TableCell>
                    <TableCell>Resultado</TableCell>
                    <TableCell>Observaciones</TableCell>
                    <TableCell>Archivo</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labs.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay resultados registrados</Typography></TableCell></TableRow>
                  ) : (
                    labs.map((lab) => (
                      <TableRow key={lab.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{getPatientName(lab.patientId)}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{lab.fecha}</Typography></TableCell>
                        <TableCell><Chip label={lab.tipoExamen} size="small" color="info" variant="outlined" sx={{ fontSize: "0.7rem" }} /></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab.resultado}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab.observaciones || "—"}</Typography></TableCell>
                        <TableCell>
                          {lab.archivoUrl ? (
                            <Tooltip title="Ver PDF">
                              <IconButton size="small" color="error" component="a" href={lab.archivoUrl} target="_blank">
                                <PictureAsPdf fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => { reset(lab); setEditId(lab.id); setTab(0); }}>Editar</Button>
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
