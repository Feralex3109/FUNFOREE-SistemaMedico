import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  ListItemIcon,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Person,
  LocalHospital,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../utils/constants";
import { DRAWER_WIDTH } from "./Sidebar";

export default function Topbar({ onToggleSidebar, sidebarOpen }) {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "#ffffff",
        boxShadow: "0 1px 0 rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        ml: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
        width: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
        transition: "all 0.2s ease",
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        <IconButton onClick={onToggleSidebar} sx={{ color: "#4A5568" }}>
          <MenuIcon />
        </IconButton>

        {/* Breadcrumb area */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          <LocalHospital sx={{ color: "#1565C0", fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ color: "#1A2332", fontWeight: 700, fontSize: "0.9rem" }}>
            FUNFOREE
          </Typography>
          <Typography variant="caption" sx={{ color: "#4A5568", fontSize: "0.75rem" }}>
            / Sistema de Información Médica
          </Typography>
        </Box>

        {/* Right side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {/* Notifications */}
          <Tooltip title="Notificaciones">
            <IconButton
              onClick={(e) => setNotifAnchor(e.currentTarget)}
              sx={{ color: "#4A5568" }}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notifAnchor}
            open={Boolean(notifAnchor)}
            onClose={() => setNotifAnchor(null)}
            PaperProps={{ sx: { width: 320, maxHeight: 400, borderRadius: 2 } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>Notificaciones</Typography>
            </Box>
            <Divider />
            {[
              { msg: "Cita programada para mañana", type: "info", time: "Hace 2h" },
              { msg: "Episodio grave registrado — Paciente #001", type: "error", time: "Hace 4h" },
              { msg: "Stock bajo de Factor VIII", type: "warning", time: "Hace 1d" },
            ].map((n, i) => (
              <MenuItem key={i} sx={{ py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <Box>
                  <Typography variant="body2" fontSize="0.8rem">{n.msg}</Typography>
                  <Typography variant="caption" color="text.secondary">{n.time}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* User menu */}
          <Tooltip title="Mi cuenta">
            <Box
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                cursor: "pointer",
                pl: 1,
                py: 0.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                transition: "background 0.2s",
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "#1565C0",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {userData?.displayName?.charAt(0) || "U"}
              </Avatar>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A2332", lineHeight: 1.2, fontSize: "0.8rem" }}>
                  {userData?.displayName || "Usuario"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#4A5568", fontSize: "0.68rem" }}>
                  {ROLE_LABELS[userData?.role]}
                </Typography>
              </Box>
            </Box>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { minWidth: 200, borderRadius: 2, mt: 1 } }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>{userData?.displayName}</Typography>
              <Typography variant="caption" color="text.secondary">{userData?.email}</Typography>
              <Box mt={0.5}>
                <Chip label={ROLE_LABELS[userData?.role]} size="small" color="primary" />
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate("/perfil"); }}>
              <ListItemIcon><Person fontSize="small" /></ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <ListItemIcon><Logout fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
