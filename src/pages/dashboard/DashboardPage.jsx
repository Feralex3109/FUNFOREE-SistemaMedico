import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Button,
  Paper,
  Stack,
} from "@mui/material";
import {
  PersonSearch,
  BloodtypeOutlined,
  CalendarMonth,
  Science,
  TrendingUp,
  TrendingDown,
  LocalHospital,
  Vaccines,
  Assessment,
  DashboardCustomize,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../firebase/firestore";
import { formatDate } from "../../utils/helpers";
import { DIAGNOSTICOS, ROLE_LABELS } from "../../utils/constants";

const COLORS = ["#1565C0", "#2E7D32", "#F57C00", "#D32F2F", "#7B1FA2"];

const StatCard = ({ title, value, subtitle, icon, color, trend, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.2s ease",
      "&:hover": onClick ? { transform: "translateY(-4px)", boxShadow: 6 } : {},
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(135deg, ${color}12 0%, rgba(255,255,255,0.95) 100%)`,
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box flex={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.06em" fontSize="0.65rem">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} color="text.primary" mt={0.5} lineHeight={1}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" mt={0.6} display="block">
              {subtitle}
            </Typography>
          )}
          {trend !== undefined && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.8}>
              {trend >= 0 ? (
                <TrendingUp sx={{ fontSize: 14, color: "success.main" }} />
              ) : (
                <TrendingDown sx={{ fontSize: 14, color: "error.main" }} />
              )}
              <Typography variant="caption" color={trend >= 0 ? "success.main" : "error.main"} fontWeight={700}>
                {Math.abs(trend)}% este mes
              </Typography>
            </Box>
          )}
        </Box>
        <Avatar sx={{ width: 52, height: 52, bgcolor: `${color}20`, color, border: `2px solid ${color}30` }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
    <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 0%, ${color}10 100%)`, pointerEvents: "none" }} />
  </Card>
);

const monthlyData = [
  { mes: "Mar", pacientes: 28, episodios: 12, citas: 45 },
  { mes: "Abr", pacientes: 31, episodios: 9, citas: 52 },
  { mes: "May", pacientes: 35, episodios: 15, citas: 48 },
  { mes: "Jun", pacientes: 38, episodios: 11, citas: 61 },
  { mes: "Jul", pacientes: 42, episodios: 8, citas: 55 },
  { mes: "Ago", pacientes: 45, episodios: 14, citas: 67 },
];

export default function DashboardPage() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const diagData = DIAGNOSTICOS.map((d, i) => ({
    name: d.label,
    value: stats?.patientsData?.filter((p) => p.diagnostico === d.value).length || 0,
    color: COLORS[i],
  }));

  const gravedad = [
    { name: "Leve", value: stats?.episodesData?.filter((e) => e.gravedad === "leve").length || 0, color: "#F57C00" },
    { name: "Moderado", value: stats?.episodesData?.filter((e) => e.gravedad === "moderado").length || 0, color: "#1565C0" },
    { name: "Grave", value: stats?.episodesData?.filter((e) => e.gravedad === "grave").length || 0, color: "#D32F2F" },
    { name: "Muy Grave", value: stats?.episodesData?.filter((e) => e.gravedad === "muy_grave").length || 0, color: "#7B1FA2" },
  ];

  const quickActions = [
    { label: "Nuevo Paciente", icon: <PersonSearch />, path: "/pacientes/nuevo", color: "#1565C0", module: ["admin", "medico", "administrativo"] },
    { label: "Nueva Cita", icon: <CalendarMonth />, path: "/citas", color: "#2E7D32", module: ["admin", "medico", "administrativo"] },
    { label: "Registrar Episodio", icon: <BloodtypeOutlined />, path: "/episodios", color: "#D32F2F", module: ["admin", "medico"] },
    { label: "Nuevo Tratamiento", icon: <Vaccines />, path: "/tratamientos", color: "#7B1FA2", module: ["admin", "medico"] },
    { label: "Laboratorio", icon: <Science />, path: "/laboratorios", color: "#F57C00", module: ["admin", "medico"] },
    { label: "Ver Reportes", icon: <Assessment />, path: "/reportes", color: "#0288D1", module: ["admin", "medico"] },
  ].filter((action) => action.module.includes(userData?.role));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          color: "#fff",
          background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 45%, #29B6F6 100%)",
          boxShadow: "0 20px 45px rgba(13, 71, 161, 0.24)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.16)", width: 42, height: 42 }}>
                <DashboardCustomize />
              </Avatar>
              <Typography variant="h5" fontWeight={800}>
                Bienvenido, {userData?.displayName?.split(" ")[0] || "Usuario"} 👋
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", maxWidth: 640 }}>
              Aquí tienes una vista rápida del estado general del sistema, los pacientes activos y las tareas más importantes del día.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip label={ROLE_LABELS[userData?.role] || "Usuario"} sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "#fff", fontWeight: 700 }} />
            <Chip label={formatDate(new Date(), "EEEE, d 'de' MMMM")} sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff", fontWeight: 700 }} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2.5}>
        {[
          { title: "Total Pacientes", value: stats?.totalPatients || 0, subtitle: `${stats?.activePatients || 0} activos actualmente`, icon: <PersonSearch />, color: "#1565C0", trend: 8, onClick: () => navigate("/pacientes") },
          { title: "Pacientes Activos", value: stats?.activePatients || 0, subtitle: "En seguimiento médico", icon: <LocalHospital />, color: "#2E7D32", trend: 5, onClick: () => navigate("/pacientes") },
          { title: "Citas Programadas", value: stats?.totalAppointments || 0, subtitle: "Total registradas", icon: <CalendarMonth />, color: "#F57C00", trend: 12, onClick: () => navigate("/citas") },
          { title: "Episodios Registrados", value: stats?.totalEpisodes || 0, subtitle: "Eventos hemorrágicos", icon: <BloodtypeOutlined />, color: "#D32F2F", trend: -3, onClick: () => navigate("/episodios") },
        ].map((card) => (
          <Grid item xs={12} sm={6} lg={3} key={card.title}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Evolución Mensual</Typography>
                  <Typography variant="caption" color="text.secondary">Últimos 6 meses</Typography>
                </Box>
                <Chip label="Indicadores clave" color="primary" size="small" />
              </Box>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565C0" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEpisodios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D32F2F" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#D32F2F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                  <Legend />
                  <Area type="monotone" dataKey="pacientes" name="Pacientes" stroke="#1565C0" strokeWidth={2} fill="url(#colorPacientes)" />
                  <Area type="monotone" dataKey="citas" name="Citas" stroke="#2E7D32" strokeWidth={2} fill="url(#colorCitas)" />
                  <Area type="monotone" dataKey="episodios" name="Episodios" stroke="#D32F2F" strokeWidth={2} fill="url(#colorEpisodios)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={0.5}>Diagnósticos</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Distribución de pacientes</Typography>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={diagData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {diagData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                </PieChart>
              </ResponsiveContainer>
              <Box display="flex" flexDirection="column" gap={0.8} mt={1}>
                {diagData.map((d) => (
                  <Box key={d.name} display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: d.color }} />
                      <Typography variant="caption" color="text.secondary">{d.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700}>{d.value}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={0.5}>Episodios por Gravedad</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>Total registrados</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={gravedad} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <ChartTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {gravedad.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>Accesos Rápidos</Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((action) => (
                  <Grid item xs={6} key={action.label}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Box sx={{ color: action.color }}>{action.icon}</Box>}
                      onClick={() => navigate(action.path)}
                      sx={{
                        py: 1.5,
                        justifyContent: "flex-start",
                        borderColor: `${action.color}30`,
                        bgcolor: `${action.color}06`,
                        color: "text.primary",
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": {
                          borderColor: action.color,
                          bgcolor: `${action.color}12`,
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
