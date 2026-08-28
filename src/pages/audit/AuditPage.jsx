import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, TextField, InputAdornment,
} from "@mui/material";
import { Search, AdminPanelSettings } from "@mui/icons-material";
import { getCollection } from "../../firebase/firestore";
import { orderBy } from "firebase/firestore";
import { formatDateTime } from "../../utils/helpers";

const ACTION_COLORS = {
  LOGIN: "success",
  LOGOUT: "default",
  CREATE: "primary",
  UPDATE: "warning",
  DELETE: "error",
  VIEW: "info",
  EXPORT: "secondary",
};

const MODULE_LABELS = {
  auth: "Autenticación",
  patients: "Pacientes",
  medicalRecords: "Historia Clínica",
  treatments: "Tratamientos",
  episodes: "Episodios",
  medications: "Medicamentos",
  appointments: "Citas",
  laboratories: "Laboratorios",
  reports: "Reportes",
  users: "Usuarios",
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    getCollection("auditLogs", [orderBy("timestamp", "desc")])
      .then((data) => { setLogs(data); setFiltered(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(logs); return; }
    const s = search.toLowerCase();
    setFiltered(logs.filter((l) =>
      l.action?.toLowerCase().includes(s) ||
      l.module?.toLowerCase().includes(s) ||
      l.details?.toLowerCase().includes(s) ||
      l.userId?.toLowerCase().includes(s)
    ));
    setPage(0);
  }, [search, logs]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>Registro de Auditoría</Typography>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} evento(s) registrado(s)
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ pb: "12px !important", pt: "12px !important" }}>
          <TextField
            placeholder="Buscar por acción, módulo, detalles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ width: { xs: "100%", md: 360 } }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.disabled" }} /></InputAdornment>,
            }}
          />
        </CardContent>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha / Hora</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <AdminPanelSettings sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography color="text.secondary">No hay registros de auditoría</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {formatDateTime(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                        {log.userId?.substring(0, 10)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={ACTION_COLORS[log.action] || "default"}
                        sx={{ fontWeight: 700, fontSize: "0.65rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>
                        {MODULE_LABELS[log.module] || log.module}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ maxWidth: 300, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.details}
                      </Typography>
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
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Card>
    </Box>
  );
}
