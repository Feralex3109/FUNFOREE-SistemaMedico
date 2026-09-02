import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, Tooltip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, Avatar, Stack,
} from "@mui/material";
import { Save, Add, Medication, Warning, Edit, AddCircle, PhotoCamera, Delete } from "@mui/icons-material";
import { getActiveDocuments, addDocument, updateDocument, softDeleteDocument } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";

const schema = yup.object({
  nombre: yup.string().required("El nombre es requerido"),
  tipo: yup.string().required("El tipo es requerido"),
  unidad: yup.string().required("La unidad es requerida"),
  stock: yup.number().min(0).required("El stock es requerido").typeError("Ingrese un número"),
  stockMinimo: yup.number().min(0).required("El stock mínimo es requerido").typeError("Ingrese un número"),
  lote: yup.string(),
  fechaVencimiento: yup.string(),
  descripcion: yup.string(),
  presentacion: yup.string(),
  altoCosto: yup.boolean(),
});

export default function MedicationsPage() {
  const { currentUser, isAdmin } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [editId, setEditId] = useState(null);
  const [entregaDialog, setEntregaDialog] = useState({ open: false, med: null });
  const [entregaData, setEntregaData] = useState({ paciente: "", cantidad: 1, fecha: new Date().toISOString().substring(0, 10), observaciones: "" });
  const [patients, setPatients] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { altoCosto: false, stock: 0, stockMinimo: 5 },
  });

  const load = async () => {
    const [m, p] = await Promise.all([
      getActiveDocuments("medications"),
      getActiveDocuments("patients"),
    ]);
    setMedications(m);
    setPatients(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file) => {
    if (!file) return "";
    setUploading(true);
    setUploadProgress(0);
    const safeName = file.name.replace(/\s+/g, "_");
    const imageRef = storageRef(storage, `medications/${Date.now()}-${safeName}`);
    await uploadBytes(imageRef, file);
    setUploadProgress(100);
    return getDownloadURL(imageRef);
  };

  const readImageAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      const imageUrl = previewUrl || data.imagenUrl || "";
      const payload = { ...data, imagenUrl: imageUrl, historialEntregas: [] };
      if (editId) {
        await updateDocument("medications", editId, payload);
      } else {
        await addDocument("medications", payload, currentUser.uid);
      }
      setSuccess("Medicamento guardado correctamente");
      await load();
      reset({ altoCosto: false, stock: 0, stockMinimo: 5, imagenUrl: "" });
      setEditId(null);
      setPreviewUrl("");
      setTab(1);
    } catch (e) {
      setError("Error al guardar el medicamento");
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");

    let dataUrl = "";
    try {
      dataUrl = await readImageAsDataUrl(file);
      setPreviewUrl(dataUrl);
      setValue("imagenUrl", dataUrl);
    } catch {
      setError("No se pudo procesar la imagen");
      return;
    }

    try {
      const url = await uploadImage(file);
      if (url) {
        setPreviewUrl(url);
        setValue("imagenUrl", url);
        setSuccess("La foto del medicamento se subió correctamente");
      }
    } catch {
      setPreviewUrl(dataUrl);
      setValue("imagenUrl", dataUrl);
      setSuccess("La foto quedó adjunta al registro del medicamento y se mostrará en la app");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    setValue("imagenUrl", "");
  };

  const handleEntrega = async () => {
    if (!entregaDialog.med) return;
    const med = entregaDialog.med;
    const nuevasEntregas = [...(med.historialEntregas || []), {
      ...entregaData,
      fecha: entregaData.fecha,
      registradoPor: currentUser.uid,
    }];
    const nuevoStock = med.stock - parseInt(entregaData.cantidad, 10);
    await updateDocument("medications", med.id, {
      historialEntregas: nuevasEntregas,
      stock: nuevoStock >= 0 ? nuevoStock : 0,
    });
    setEntregaDialog({ open: false, med: null });
    await load();
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  const lowStock = medications.filter((m) => m.stock <= m.stockMinimo);

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h5" fontWeight={700}>Medicamentos e Inventario</Typography>
          <Typography variant="body2" color="text.secondary">Control de stock y entrega de medicamentos</Typography>
        </Box>
        {lowStock.length > 0 && (
          <Chip icon={<Warning />} label={`${lowStock.length} medicamento(s) con stock bajo`} color="warning" />
        )}
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label={editId ? "Editar" : "Registrar"} icon={<Add />} iconPosition="start" />
          <Tab label={`Inventario (${medications.length})`} icon={<Medication />} iconPosition="start" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField label="Nombre del Medicamento *" fullWidth {...register("nombre")} error={!!errors.nombre} helperText={errors.nombre?.message} /></Grid>
                <Grid item xs={12} md={6}>
                  <Controller name="tipo" control={control} render={({ field }) => (
                    <TextField select label="Tipo *" fullWidth {...field} error={!!errors.tipo} helperText={errors.tipo?.message}>
                      {["Factor VIII", "Factor IX", "Factor von Willebrand", "Antifibrinolítico", "Desmopresina", "Otro"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={4} md={2}><TextField label="Stock Actual *" type="number" fullWidth {...register("stock")} error={!!errors.stock} helperText={errors.stock?.message} /></Grid>
                <Grid item xs={4} md={2}><TextField label="Stock Mínimo *" type="number" fullWidth {...register("stockMinimo")} error={!!errors.stockMinimo} helperText={errors.stockMinimo?.message} /></Grid>
                <Grid item xs={4} md={2}><TextField label="Unidad *" fullWidth {...register("unidad")} error={!!errors.unidad} helperText={errors.unidad?.message} placeholder="UI, mg, vial..." /></Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    label="Lote / Número de lote"
                    fullWidth
                    {...register("lote")}
                    helperText="Identificador del lote o fabricación del medicamento."
                  />
                </Grid>
                <Grid item xs={6} md={3}><TextField label="Fecha Vencimiento" type="date" fullWidth {...register("fechaVencimiento")} InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} md={2}>
                  <Controller name="altoCosto" control={control} render={({ field }) => (
                    <TextField select label="Alto Costo *" fullWidth {...field} value={field.value ? "si" : "no"} onChange={(e) => field.onChange(e.target.value === "si")}>
                      <MenuItem value="si">Sí</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={6}><TextField label="Presentación" fullWidth {...register("presentacion")} placeholder="Vial, caja, crema, etc." /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Descripción del medicamento"
                    fullWidth
                    multiline
                    minRows={3}
                    {...register("descripcion")}
                    placeholder="Ejemplo: Medicamento para profilaxis, se administra cada 48 horas y debe conservarse en frío."
                    helperText="Escribe para qué sirve, cómo se administra y cualquier detalle importante para el equipo clínico."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Foto del medicamento</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <Button variant="outlined" startIcon={<PhotoCamera />} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? (uploadProgress > 0 ? `Subiendo ${uploadProgress}%` : 'Procesando imagen...') : 'Seleccionar imagen'}
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
                      <Typography variant="body2" color="text.secondary">Puedes adjuntar una foto para identificar mejor el medicamento.</Typography>
                    </Stack>
                    {uploading && uploadProgress === 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        La foto está siendo preparada y guardada. Este mensaje cambiará cuando termine.
                      </Typography>
                    )}
                    {(previewUrl || watch('imagenUrl')) && (
                      <Box mt={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        <Avatar src={previewUrl || watch('imagenUrl')} variant="rounded" sx={{ width: 96, height: 96 }} />
                        <Button color="error" variant="text" startIcon={<Delete />} onClick={handleRemoveImage}>Quitar imagen</Button>
                      </Box>
                    )}
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => { reset({ altoCosto: false, stock: 0, stockMinimo: 5, imagenUrl: "" }); setEditId(null); setPreviewUrl(""); }}>Limpiar</Button>
                    <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving}>
                      {editId ? "Actualizar" : "Registrar Medicamento"}
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
                    <TableCell>Medicamento</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Alto Costo</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Unidad</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Entregas</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {medications.length === 0 ? (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay medicamentos registrados</Typography></TableCell></TableRow>
                  ) : (
                    medications.map((m) => {
                      const stockPct = m.stockMinimo > 0 ? Math.min((m.stock / (m.stockMinimo * 4)) * 100, 100) : 100;
                      const isLow = m.stock <= m.stockMinimo;
                      return (
                        <TableRow key={m.id} hover sx={{ bgcolor: isLow ? "rgba(245,124,0,0.04)" : "transparent" }}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1.2}>
                              {m.imagenUrl ? <Avatar src={m.imagenUrl} variant="rounded" sx={{ width: 40, height: 40 }} /> : <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'primary.light', color: 'primary.main' }}><Medication /></Avatar>}
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{m.nombre}</Typography>
                                {m.descripcion && <Typography variant="caption" color="text.secondary" display="block">{m.descripcion}</Typography>}
                                {m.lote && <Typography variant="caption" color="text.secondary">Lote: {m.lote}</Typography>}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="body2">{m.tipo}</Typography></TableCell>
                          <TableCell><Chip label={m.altoCosto ? "Sí" : "No"} size="small" color={m.altoCosto ? "error" : "default"} /></TableCell>
                          <TableCell>
                            <Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {isLow && <Warning sx={{ fontSize: 14, color: "warning.main" }} />}
                                <Typography variant="body2" fontWeight={600} color={isLow ? "warning.main" : "text.primary"}>{m.stock} {m.unidad}</Typography>
                              </Box>
                              <LinearProgress value={stockPct} variant="determinate" color={isLow ? "warning" : "success"} sx={{ height: 4, borderRadius: 2, mt: 0.5, width: 80 }} />
                            </Box>
                          </TableCell>
                          <TableCell>{m.presentacion || m.unidad}</TableCell>
                          <TableCell><Typography variant="caption">{m.fechaVencimiento || "—"}</Typography></TableCell>
                          <TableCell><Chip label={m.historialEntregas?.length || 0} size="small" color="primary" variant="outlined" /></TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Registrar Entrega">
                                <IconButton size="small" color="success" onClick={() => setEntregaDialog({ open: true, med: m })}>
                                  <AddCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton size="small" color="warning" onClick={() => { reset(m); setEditId(m.id); setTab(0); }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Entrega Dialog */}
      <Dialog open={entregaDialog.open} onClose={() => setEntregaDialog({ open: false, med: null })} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Registrar Entrega — {entregaDialog.med?.nombre}</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select label="Paciente" fullWidth size="small" value={entregaData.paciente} onChange={(e) => setEntregaData({ ...entregaData, paciente: e.target.value })}>
                {patients.map((p) => <MenuItem key={p.id} value={`${p.nombre} ${p.apellidos}`}>{p.nombre} {p.apellidos}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Cantidad" type="number" fullWidth size="small" value={entregaData.cantidad} onChange={(e) => setEntregaData({ ...entregaData, cantidad: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Fecha Entrega" type="date" fullWidth size="small" value={entregaData.fecha} onChange={(e) => setEntregaData({ ...entregaData, fecha: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Observaciones" fullWidth size="small" multiline rows={2} value={entregaData.observaciones} onChange={(e) => setEntregaData({ ...entregaData, observaciones: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEntregaDialog({ open: false, med: null })}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleEntrega}>Confirmar Entrega</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
