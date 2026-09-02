import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MODULE_PERMISSIONS } from "../utils/constants";
import { Box, CircularProgress } from "@mui/material";

export default function ProtectedRoute({ children, module }) {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (module && userData) {
    const allowed = MODULE_PERMISSIONS[module] || [];
    if (!allowed.includes(userData.role)) {
      return <Navigate to="/no-autorizado" replace />;
    }
  }

  return children;
}
