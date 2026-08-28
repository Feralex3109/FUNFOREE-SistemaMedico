import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardContent, TextField, InputAdornment,
  Typography, Chip, IconButton, MenuItem, Select, FormControl,
  InputLabel, Grid, Tooltip, Avatar, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider,
} from "@mui/material";
import {
  Search, Add, Edit, Delete, Visibility, FilterList,
  PersonSearch, Download, Refresh, MoreVert,
} from "@mui/icons-material";
import { getActiveDocuments, softDeleteDocument, logAudit } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { DIAGNOSTICOS, ESTADOS_PACIENTE, SEXOS } from "../../utils/constants";
import { formatDate, getInitials } from "../../utils/helpers";

const diagLabel = (val) => {
  const match = DIAGNOSTICOS.find((d) => d.value === val);
  if (match) return match.label;
  return val || "Sin diagnóstico";
};
const estadoColor = (val) => ESTADOS_PACIENTE.find((e) => e.value === val)?.color || "default";
const estadoLabel = (val) => ESTADOS_PACIENTE.find((e) => e.value === val)?.label || val;

export default function PatientsListPage() {
  const navigate = useNavigate();
  const { currentUser, isAdmin, isMedico } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDiag, setFilterDiag] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, patient: null });
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getActiveDocuments("patients");
      setPatients(data);
      setFiltered(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = [...patients];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(s) ||
          p.apellidos?.toLowerCase().includes(s) ||
          p.documento?.toLowerCase().includes(s) ||
          p.eps?.toLowerCase().includes(s)
      );
    }
    if (filterDiag !== "all") result = result.filter((p) => p.diagnostico === filterDiag);
    if (filterEstado !== "all") result = result.filter((p) => p.estado === filterEstado);
    setFiltered(result);
    setPage(0);
  }, [search, filterDiag, filterEstado, patients]);

  const handleDelete = async () => {
    if (!deleteDialog.patient) return;
    setDeleting(true);
    try {
      await softDeleteDocument("patients", deleteDialog.patient.id);
      await logAudit({ userId: currentUser.uid, action: "DELETE", module: "patients", documentId: deleteDialog.patient.id, details: `Paciente eliminado: ${deleteDialog.patient.nombre}` });
      await load();
      setDeleteDialog({ open: false, patient: null });
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Gestión de Pacientes</Typography>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} paciente(s) encontrado(s)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Actualizar">
            <IconButton onClick={load} color="primary"><Refresh /></IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/pacientes/nuevo")}
          >
            Nuevo Paciente
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: "12px !important", pt: "12px !important" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por nombre, documento, EPS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><Search sx={{ color: "text.disabled" }} /></InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Diagnóstico</InputLabel>
                <Select value={filterDiag} onChange={(e) => setFilterDiag(e.target.value)} label="Diagnóstico">
                  <MenuItem value="all">Todos</MenuItem>
                  {DIAGNOSTICOS.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} label="Estado">
                  <MenuItem value="all">Todos</MenuItem>
                  {ESTADOS_PACIENTE.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => { setSearch(""); setFilterDiag("all"); setFilterEstado("all"); }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Edad / Sexo</TableCell>
                <TableCell>Diagnóstico</TableCell>
                <TableCell>EPS</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <PersonSearch sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography color="text.secondary">No se encontraron pacientes</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((patient) => (
                  <TableRow key={patient.id} hover sx={{ "&:hover": { bgcolor: "rgba(21,101,192,0.03)" } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: "#1565C020", color: "#1565C0", fontWeight: 700, width: 38, height: 38, fontSize: "0.85rem" }}>
                          {getInitials(`${patient.nombre} ${patient.apellidos}`)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {patient.nombre} {patient.apellidos}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">{patient.telefono}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{patient.documento}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.edad} años</Typography>
                      <Typography variant="caption" color="text.secondary" textTransform="capitalize">{patient.sexo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={diagLabel(patient.diagnostico)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.eps}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={estadoLabel(patient.estado)}
                        size="small"
                        color={estadoColor(patient.estado)}
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" color="primary" onClick={() => navigate(`/pacientes/${patient.id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="warning" onClick={() => navigate(`/pacientes/${patient.id}/editar`)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isAdmin && (
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, patient })}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, patient: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Eliminación</DialogTitle>
        <Divider />
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            ¿Estás seguro de eliminar al paciente{" "}
            <strong>{deleteDialog.patient?.nombre} {deleteDialog.patient?.apellidos}</strong>?
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, patient: null })}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
