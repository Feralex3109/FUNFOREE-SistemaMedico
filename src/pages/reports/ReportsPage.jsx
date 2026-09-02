import { useState, useEffect } from "react";
import {
  Box, Button, Card, CardContent, Typography, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, MenuItem, Divider, Alert,
} from "@mui/material";
import {
  Assessment, PictureAsPdf, GridOn, BarChart,
  People, CalendarMonth, BloodtypeOutlined, Medication,
} from "@mui/icons-material";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { getDashboardStats } from "../../firebase/firestore";
import { DIAGNOSTICOS, GRAVEDAD_EPISODIO } from "../../utils/constants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const COLORS = ["#1565C0", "#2E7D32", "#F57C00", "#D32F2F"];

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(21, 101, 192);
    doc.text("FUNFOREE — Reporte del Sistema", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-CO")}`, 14, 30);

    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text("Indicadores Generales", 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total Pacientes", stats?.totalPatients || 0],
        ["Pacientes Activos", stats?.activePatients || 0],
        ["Total Citas", stats?.totalAppointments || 0],
        ["Episodios Hemorrágicos", stats?.totalEpisodes || 0],
        ["Entregas de Medicamentos", stats?.deliveredMedications || 0],
      ],
      headStyles: { fillColor: [21, 101, 192] },
      styles: { fontSize: 10 },
    });

    doc.text("Pacientes por Diagnóstico", 14, doc.lastAutoTable.finalY + 10);
    const diagData = DIAGNOSTICOS.map((d) => [
      d.label,
      stats?.patientsData?.filter((p) => p.diagnostico === d.value).length || 0,
    ]);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [["Diagnóstico", "Cantidad"]],
      body: diagData,
      headStyles: { fillColor: [46, 125, 50] },
      styles: { fontSize: 10 },
    });

    doc.save("reporte-funforee.pdf");
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const indicadores = [
      ["Indicador", "Valor"],
      ["Total Pacientes", stats?.totalPatients || 0],
      ["Pacientes Activos", stats?.activePatients || 0],
      ["Total Citas", stats?.totalAppointments || 0],
      ["Episodios Hemorrágicos", stats?.totalEpisodes || 0],
      ["Entregas de Medicamentos", stats?.deliveredMedications || 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(indicadores), "Indicadores");

    if (stats?.patientsData?.length > 0) {
      const patientsSheet = stats.patientsData.map((p) => ({
        Documento: p.documento,
        Nombre: p.nombre,
        Apellidos: p.apellidos,
        Edad: p.edad,
        Sexo: p.sexo,
        Diagnóstico: DIAGNOSTICOS.find((d) => d.value === p.diagnostico)?.label || p.diagnostico,
        EPS: p.eps,
        Estado: p.estado,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(patientsSheet), "Pacientes");
    }

    if (stats?.episodesData?.length > 0) {
      const epSheet = stats.episodesData.map((e) => ({
        Fecha: e.fecha,
        Gravedad: GRAVEDAD_EPISODIO.find((g) => g.value === e.gravedad)?.label || e.gravedad,
        "Zona Afectada": e.zonaAfectada,
        "Tratamiento Aplicado": e.tratamientoAplicado,
        Observaciones: e.observaciones,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(epSheet), "Episodios");
    }

    XLSX.writeFile(wb, "reporte-funforee.xlsx");
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  const diagData = DIAGNOSTICOS.map((d) => ({
    name: d.label.replace("Enfermedad de ", ""),
    value: stats?.patientsData?.filter((p) => p.diagnostico === d.value).length || 0,
  }));

  const gravedad = GRAVEDAD_EPISODIO.map((g) => ({
    name: g.label,
    value: stats?.episodesData?.filter((e) => e.gravedad === g.value).length || 0,
  }));

  const estadoCitas = [
    { name: "Programadas", value: stats?.appointmentsData?.filter((a) => a.estado === "programada").length || 0 },
    { name: "Completadas", value: stats?.appointmentsData?.filter((a) => a.estado === "completada").length || 0 },
    { name: "Canceladas", value: stats?.appointmentsData?.filter((a) => a.estado === "cancelada").length || 0 },
  ];

  return (
    <Box>
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes y Estadísticas</Typography>
          <Typography variant="body2" color="text.secondary">Indicadores del sistema y exportación de datos</Typography>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<PictureAsPdf />}
            onClick={exportPDF}
            sx={{ fontWeight: 600 }}
          >
            Exportar PDF
          </Button>
          <Button
            variant="outlined"
            color="success"
            startIcon={<GridOn />}
            onClick={exportExcel}
            sx={{ fontWeight: 600 }}
          >
            Exportar Excel
          </Button>
        </Box>
      </Box>

      {/* KPI Summary */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Total Pacientes", value: stats?.totalPatients, icon: <People />, color: "#1565C0" },
          { label: "Pacientes Activos", value: stats?.activePatients, icon: <People />, color: "#2E7D32" },
          { label: "Total Citas", value: stats?.totalAppointments, icon: <CalendarMonth />, color: "#F57C00" },
          { label: "Episodios", value: stats?.totalEpisodes, icon: <BloodtypeOutlined />, color: "#D32F2F" },
          { label: "Entregas Medicamentos", value: stats?.deliveredMedications, icon: <Medication />, color: "#7B1FA2" },
        ].map((kpi) => (
          <Grid item xs={6} md={2.4} key={kpi.label}>
            <Card sx={{ textAlign: "center", p: 1 }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Box sx={{ color: kpi.color, mb: 0.5 }}>{kpi.icon}</Box>
                <Typography variant="h4" fontWeight={700} color={kpi.color}>{kpi.value ?? "—"}</Typography>
                <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Pacientes por Diagnóstico</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={diagData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine>
                    {diagData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Episodios por Gravedad</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <ReBarChart data={gravedad}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                  <Bar dataKey="value" name="Episodios" fill="#1565C0" radius={[6, 6, 0, 0]}>
                    {gravedad.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Estado de Citas</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <ReBarChart data={estadoCitas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ChartTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                  <Bar dataKey="value" name="Citas" radius={[6, 6, 0, 0]}>
                    {estadoCitas.map((_, i) => <Cell key={i} fill={["#1565C0", "#2E7D32", "#D32F2F"][i]} />)}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Patients Table Preview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Últimos Pacientes Registrados</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Diagnóstico</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats?.patientsData || []).slice(0, 6).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><Typography variant="body2">{p.nombre} {p.apellidos}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{DIAGNOSTICOS.find((d) => d.value === p.diagnostico)?.label}</Typography></TableCell>
                        <TableCell><Chip label={p.estado} size="small" color={p.estado === "activo" ? "success" : "default"} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
