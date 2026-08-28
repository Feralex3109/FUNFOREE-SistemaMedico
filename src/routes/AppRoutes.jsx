import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import PatientsListPage from "../pages/patients/PatientsListPage";
import PatientFormPage from "../pages/patients/PatientFormPage";
import PatientDetailPage from "../pages/patients/PatientDetailPage";
import MedicalRecordsPage from "../pages/medicalRecords/MedicalRecordsPage";
import TreatmentsPage from "../pages/treatments/TreatmentsPage";
import EpisodesPage from "../pages/episodes/EpisodesPage";
import MedicationsPage from "../pages/medications/MedicationsPage";
import AppointmentsPage from "../pages/appointments/AppointmentsPage";
import LaboratoriesPage from "../pages/laboratories/LaboratoriesPage";
import ReportsPage from "../pages/reports/ReportsPage";
import UsersPage from "../pages/users/UsersPage";
import AuditPage from "../pages/audit/AuditPage";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function NotFound() {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" textAlign="center">
      <Typography variant="h1" color="primary" fontWeight={700} fontSize="5rem">404</Typography>
      <Typography variant="h5" fontWeight={600} mb={1}>Página no encontrada</Typography>
      <Typography color="text.secondary" mb={3}>La página que buscas no existe o fue movida.</Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")}>Volver al Dashboard</Button>
    </Box>
  );
}

function Unauthorized() {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" textAlign="center">
      <Typography variant="h1" color="error" fontWeight={700} fontSize="5rem">403</Typography>
      <Typography variant="h5" fontWeight={600} mb={1}>Sin autorización</Typography>
      <Typography color="text.secondary" mb={3}>No tienes permisos para acceder a este módulo.</Typography>
      <Button variant="contained" onClick={() => navigate("/dashboard")}>Volver al Dashboard</Button>
    </Box>
  );
}

function ProtectedPage({ children, module }) {
  return (
    <ProtectedRoute module={module}>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
      <Route path="/no-autorizado" element={<MainLayout><Unauthorized /></MainLayout>} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />

      <Route path="/pacientes" element={<ProtectedPage module="patients"><PatientsListPage /></ProtectedPage>} />
      <Route path="/pacientes/nuevo" element={<ProtectedPage module="patients"><PatientFormPage /></ProtectedPage>} />
      <Route path="/pacientes/:id" element={<ProtectedPage module="patients"><PatientDetailPage /></ProtectedPage>} />
      <Route path="/pacientes/:id/editar" element={<ProtectedPage module="patients"><PatientFormPage /></ProtectedPage>} />

      <Route path="/historia-clinica" element={<ProtectedPage module="medicalRecords"><MedicalRecordsPage /></ProtectedPage>} />
      <Route path="/tratamientos" element={<ProtectedPage module="treatments"><TreatmentsPage /></ProtectedPage>} />
      <Route path="/episodios" element={<ProtectedPage module="episodes"><EpisodesPage /></ProtectedPage>} />
      <Route path="/medicamentos" element={<ProtectedPage module="medications"><MedicationsPage /></ProtectedPage>} />
      <Route path="/citas" element={<ProtectedPage module="appointments"><AppointmentsPage /></ProtectedPage>} />
      <Route path="/laboratorios" element={<ProtectedPage module="laboratories"><LaboratoriesPage /></ProtectedPage>} />
      <Route path="/reportes" element={<ProtectedPage module="reports"><ReportsPage /></ProtectedPage>} />
      <Route path="/usuarios" element={<ProtectedPage module="users"><UsersPage /></ProtectedPage>} />
      <Route path="/auditoria" element={<ProtectedPage module="auditLogs"><AuditPage /></ProtectedPage>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<ProtectedRoute><MainLayout><NotFound /></MainLayout></ProtectedRoute>} />
    </Routes>
  );
}
