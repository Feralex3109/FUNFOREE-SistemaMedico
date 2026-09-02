import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
  Collapse,
  Tooltip,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Dashboard,
  People,
  PersonSearch,
  MedicalInformation,
  Vaccines,
  BloodtypeOutlined,
  Medication,
  CalendarMonth,
  Science,
  Assessment,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore,
  LocalHospital,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS, MODULE_PERMISSIONS } from "../../utils/constants";

const DRAWER_WIDTH = 260;

const navItems = [
  {
    label: "Dashboard",
    icon: <Dashboard />,
    path: "/dashboard",
    module: null,
  },
  {
    label: "Pacientes",
    icon: <PersonSearch />,
    path: "/pacientes",
    module: "patients",
  },
  {
    label: "Historia Clínica",
    icon: <MedicalInformation />,
    path: "/historia-clinica",
    module: "medicalRecords",
  },
  {
    label: "Tratamientos",
    icon: <Vaccines />,
    path: "/tratamientos",
    module: "treatments",
  },
  {
    label: "Episodios",
    icon: <BloodtypeOutlined />,
    path: "/episodios",
    module: "episodes",
  },
  {
    label: "Medicamentos",
    icon: <Medication />,
    path: "/medicamentos",
    module: "medications",
  },
  {
    label: "Citas",
    icon: <CalendarMonth />,
    path: "/citas",
    module: "appointments",
  },
  {
    label: "Laboratorios",
    icon: <Science />,
    path: "/laboratorios",
    module: "laboratories",
  },
  {
    label: "Reportes",
    icon: <Assessment />,
    path: "/reportes",
    module: "reports",
  },
  {
    label: "Usuarios",
    icon: <People />,
    path: "/usuarios",
    module: "users",
  },
  {
    label: "Auditoría",
    icon: <AdminPanelSettings />,
    path: "/auditoria",
    module: "auditLogs",
  },
];

export default function Sidebar({ open, variant = "persistent" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  const canAccess = (module) => {
    if (!module) return true;
    const allowed = MODULE_PERMISSIONS[module] || [];
    return allowed.includes(userData?.role);
  };

  const visibleItems = navItems.filter((item) => canAccess(item.module));
  const clinicalItems = visibleItems.filter((i) =>
    ["/historia-clinica", "/tratamientos", "/episodios", "/laboratorios"].includes(i.path)
  );
  const operationalItems = visibleItems.filter((i) =>
    ["/medicamentos", "/citas"].includes(i.path)
  );
  const adminItems = visibleItems.filter((i) => ["/usuarios", "/auditoria"].includes(i.path));
  const mainItems = visibleItems.filter((i) => ["/dashboard", "/pacientes", "/reportes"].includes(i.path));

  const isActive = (path) => location.pathname.startsWith(path);

  const renderItem = (item) => (
    <ListItemButton
      key={item.path}
      selected={isActive(item.path)}
      onClick={() => navigate(item.path)}
    >
      <ListItemIcon>{item.icon}</ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 2.5,
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          <LocalHospital sx={{ color: "#fff", fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: "#fff", lineHeight: 1.2, fontWeight: 700, fontSize: "0.95rem" }}>
            FUNFOREE
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.68rem" }}>
            Sistema Médico
          </Typography>
        </Box>
      </Box>

      {/* User Info */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "rgba(255,255,255,0.25)",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {userData?.displayName?.charAt(0) || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ color: "#fff", fontWeight: 600, lineHeight: 1.2, fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {userData?.displayName || "Usuario"}
            </Typography>
            <Chip
              label={ROLE_LABELS[userData?.role] || ""}
              size="small"
              sx={{
                height: 16,
                fontSize: "0.6rem",
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#fff",
                fontWeight: 600,
                mt: 0.3,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 1, "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.2)", borderRadius: 2 } }}>
        <List dense disablePadding>
          {mainItems.map(renderItem)}
        </List>

        {clinicalItems.length > 0 && (
          <>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", px: 2.5, mt: 1.5, mb: 0.5, display: "block", fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.65rem", textTransform: "uppercase" }}>
              Clínico
            </Typography>
            <List dense disablePadding>{clinicalItems.map(renderItem)}</List>
          </>
        )}

        {operationalItems.length > 0 && (
          <>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", px: 2.5, mt: 1.5, mb: 0.5, display: "block", fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.65rem", textTransform: "uppercase" }}>
              Operativo
            </Typography>
            <List dense disablePadding>{operationalItems.map(renderItem)}</List>
          </>
        )}

        {adminItems.length > 0 && (
          <>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", px: 2.5, mt: 1.5, mb: 0.5, display: "block", fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.65rem", textTransform: "uppercase" }}>
              Administración
            </Typography>
            <List dense disablePadding>{adminItems.map(renderItem)}</List>
          </>
        )}
      </Box>

      {/* Version */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem" }}>
          v1.0.0 — FUNFOREE © 2025
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
