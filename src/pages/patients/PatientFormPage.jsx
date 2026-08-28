import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography,
  Grid, MenuItem, CircularProgress, Alert, Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Save, ArrowBack, PersonAdd } from "@mui/icons-material";
import { addDocument, updateDocument, getDocument, logAudit } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { ESTADOS_PACIENTE, SEXOS, EPS_LISTA } from "../../utils/constants";

const schema = yup.object({
  documento: yup.string().min(5, "Mínimo 5 caracteres").required("El documento es requerido"),
  nombre: yup.string().min(2, "Mínimo 2 caracteres").required("El nombre es requerido"),
  apellidos: yup.string().min(2, "Mínimo 2 caracteres").required("Los apellidos son requeridos"),
  edad: yup.number().min(0).max(120).required("La edad es requerida").typeError("Ingrese una edad válida"),
  sexo: yup.string().required("El sexo es requerido"),
  direccion: yup.string().min(5, "Mínimo 5 caracteres").required("La dirección es requerida"),
  telefono: yup.string().min(7, "Mínimo 7 dígitos").required("El teléfono es requerido"),
  eps: yup.string().required("La EPS es requerida"),
  diagnostico: yup.string().required("El diagnóstico es requerido"),
  estado: yup.string().required("El estado es requerido"),
});

export default function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { estado: "activo", sexo: "masculino", diagnostico: "" },
  });

  useEffect(() => {
    if (isEdit) {
      getDocument("patients", id)
        .then((data) => { if (data) reset(data); })
        .catch(console.error)
        .finally(() => setFetchLoading(false));
    }
  }, [id]);

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      if (isEdit) {
        await updateDocument("patients", id, data);
        await logAudit({ userId: currentUser.uid, action: "UPDATE", module: "patients", documentId: id, details: `Paciente actualizado: ${data.nombre}` });
        setSuccess("Paciente actualizado exitosamente");
      } else {
        const newId = await addDocument("patients", data, currentUser.uid);
        await logAudit({ userId: currentUser.uid, action: "CREATE", module: "patients", documentId: newId, details: `Nuevo paciente: ${data.nombre}` });
        setSuccess("Paciente registrado exitosamente");
        setTimeout(() => navigate(`/pacientes/${newId}`), 1200);
      }
    } catch (e) {
      setError("Error al guardar el paciente. Intente nuevamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <MuiLink component="button" onClick={() => navigate("/pacientes")} underline="hover" color="inherit" sx={{ cursor: "pointer", fontSize: "0.875rem" }}>
            Pacientes
          </MuiLink>
          <Typography color="text.primary" fontSize="0.875rem">
            {isEdit ? "Editar Paciente" : "Nuevo Paciente"}
          </Typography>
        </Breadcrumbs>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate("/pacientes")} variant="outlined" size="small">
            Volver
          </Button>
          <Typography variant="h5" fontWeight={700}>
            {isEdit ? "Editar Paciente" : "Registrar Nuevo Paciente"}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Datos personales */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2} color="primary">
              📋 Datos Personales
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Número de Documento" fullWidth {...register("documento")} error={!!errors.documento} helperText={errors.documento?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Nombres" fullWidth {...register("nombre")} error={!!errors.nombre} helperText={errors.nombre?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Apellidos" fullWidth {...register("apellidos")} error={!!errors.apellidos} helperText={errors.apellidos?.message} />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField label="Edad" type="number" fullWidth {...register("edad")} error={!!errors.edad} helperText={errors.edad?.message} />
              </Grid>
              <Grid item xs={6} md={3}>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Sexo" fullWidth {...field} error={!!errors.sexo} helperText={errors.sexo?.message}>
                      {SEXOS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <TextField label="Dirección" fullWidth {...register("direccion")} error={!!errors.direccion} helperText={errors.direccion?.message} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Teléfono" fullWidth {...register("telefono")} error={!!errors.telefono} helperText={errors.telefono?.message} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Datos médicos */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2} color="secondary">
              🏥 Datos Médicos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Controller
                  name="eps"
                  control={control}
                  render={({ field }) => (
                    <TextField select label="EPS" fullWidth {...field} error={!!errors.eps} helperText={errors.eps?.message}>
                      {EPS_LISTA.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Diagnóstico clínico"
                  fullWidth
                  multiline
                  minRows={3}
                  {...register("diagnostico")}
                  error={!!errors.diagnostico}
                  helperText={errors.diagnostico?.message || "Escribe el diagnóstico o la evaluación clínica del paciente."}
                  placeholder="Ejemplo: Paciente con hemofilia A, historial de episodios articulares, tratamiento en profilaxis y seguimiento por hematología."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="estado"
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Estado" fullWidth {...field} error={!!errors.estado} helperText={errors.estado?.message}>
                      {ESTADOS_PACIENTE.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Actions */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate("/pacientes")}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={loading}
            sx={{ px: 4 }}
          >
            {isEdit ? "Guardar Cambios" : "Registrar Paciente"}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
