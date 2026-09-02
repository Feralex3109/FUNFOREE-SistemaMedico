import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box, Button, Card, CardContent, TextField, Typography, Grid,
  MenuItem, CircularProgress, Alert, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tab, Tabs, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from "@mui/material";
import { Save, Add, People, Edit, Block, CheckCircle } from "@mui/icons-material";
import { getActiveDocuments, updateDocument, logAudit } from "../../firebase/firestore";
import { registerUser } from "../../firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { ROLES, ROLE_LABELS } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const schema = yup.object({
  displayName: yup.string().min(3, "Mínimo 3 caracteres").required("El nombre es requerido"),
  email: yup.string().email("Correo inválido").required("El correo es requerido"),
  password: yup.string().min(6, "Mínimo 6 caracteres").required("La contraseña es requerida"),
  role: yup.string().required("El rol es requerido"),
  phone: yup.string(),
  specialty: yup.string(),
});

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState(0);
  const [toggleDialog, setToggleDialog] = useState({ open: false, user: null });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: "medico" },
  });

  const load = async () => {
    try {
      const u = await getActiveDocuments("users");
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    setError("");
    try {
      await registerUser(data.email, data.password, { ...data, createdBy: currentUser.uid });
      await logAudit({ userId: currentUser.uid, action: "CREATE", module: "users", details: `Nuevo usuario: ${data.email} (${data.role})` });
      setSuccess("Usuario creado exitosamente");
      await load();
      reset({ role: "medico" });
      setTab(1);
    } catch (e) {
      const msg = e.code === "auth/email-already-in-use" ? "Este correo ya está registrado" : e.message || "Error al crear el usuario";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    const user = toggleDialog.user;
    await updateDocument("users", user.uid, { active: !user.active });
    await logAudit({ userId: currentUser.uid, action: "UPDATE", module: "users", documentId: user.uid, details: `Usuario ${!user.active ? "activado" : "desactivado"}: ${user.email}` });
    await load();
    setToggleDialog({ open: false, user: null });
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Gestión de Usuarios</Typography>
        <Typography variant="body2" color="text.secondary">Administración de accesos y roles del sistema</Typography>
      </Box>

      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
          <Tab label="Crear Usuario" icon={<Add />} iconPosition="start" />
          <Tab label={`Usuarios (${users.length})`} icon={<People />} iconPosition="start" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField label="Nombre Completo *" fullWidth {...register("displayName")} error={!!errors.displayName} helperText={errors.displayName?.message} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Correo Electrónico *" type="email" fullWidth {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Contraseña *" type="password" fullWidth {...register("password")} error={!!errors.password} helperText={errors.password?.message} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller name="role" control={control} render={({ field }) => (
                    <TextField select label="Rol *" fullWidth {...field} error={!!errors.role} helperText={errors.role?.message}>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                      ))}
                    </TextField>
                  )} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Teléfono" fullWidth {...register("phone")} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Especialidad (para médicos)" fullWidth {...register("specialty")} />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => reset({ role: "medico" })}>Limpiar</Button>
                    <Button type="submit" variant="contained" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving}>
                      Crear Usuario
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
                    <TableCell>Nombre</TableCell>
                    <TableCell>Correo</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Especialidad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No hay usuarios registrados</Typography></TableCell></TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.uid || user.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{user.displayName}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{user.email}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={ROLE_LABELS[user.role]}
                            size="small"
                            color={user.role === "admin" ? "error" : user.role === "medico" ? "primary" : "secondary"}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell><Typography variant="body2">{user.phone || "—"}</Typography></TableCell>
                        <TableCell><Typography variant="body2">{user.specialty || "—"}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={user.active ? "Activo" : "Inactivo"}
                            size="small"
                            color={user.active ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={user.active ? "Desactivar" : "Activar"}>
                            <IconButton
                              size="small"
                              color={user.active ? "error" : "success"}
                              onClick={() => setToggleDialog({ open: true, user })}
                              disabled={user.uid === currentUser.uid || user.id === currentUser.uid}
                            >
                              {user.active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                            </IconButton>
                          </Tooltip>
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

      {/* Toggle Dialog */}
      <Dialog open={toggleDialog.open} onClose={() => setToggleDialog({ open: false, user: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>
          {toggleDialog.user?.active ? "Desactivar Usuario" : "Activar Usuario"}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Alert severity={toggleDialog.user?.active ? "warning" : "info"} sx={{ borderRadius: 2 }}>
            ¿Deseas {toggleDialog.user?.active ? "desactivar" : "activar"} al usuario{" "}
            <strong>{toggleDialog.user?.displayName}</strong>?
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setToggleDialog({ open: false, user: null })}>Cancelar</Button>
          <Button
            variant="contained"
            color={toggleDialog.user?.active ? "error" : "success"}
            onClick={toggleActive}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
