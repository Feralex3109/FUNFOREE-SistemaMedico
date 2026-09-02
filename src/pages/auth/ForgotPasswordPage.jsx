import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Email, ArrowBack, LocalHospital } from "@mui/icons-material";
import { resetPassword } from "../../firebase/auth";

const schema = yup.object({
  email: yup.string().email("Correo inválido").required("El correo es requerido"),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ email }) => {
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.code === "auth/user-not-found" ? "No existe una cuenta con este correo" : "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)",
        p: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          bgcolor: "rgba(255,255,255,0.97)",
          borderRadius: 4,
          p: { xs: 3, sm: 5 },
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        }}
      >
        <Box textAlign="center" mb={3}>
          <LocalHospital sx={{ fontSize: 44, color: "#1565C0" }} />
          <Typography variant="h5" fontWeight={700} mt={1}>Recuperar Contraseña</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Te enviaremos un enlace para restablecer tu contraseña
          </Typography>
        </Box>

        {sent ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            ✅ Correo enviado exitosamente. Revisa tu bandeja de entrada.
          </Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Correo electrónico"
                  type="email"
                  fullWidth
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: "#1565C0", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : "Enviar Enlace"}
                </Button>
              </Box>
            </form>
          </>
        )}

        <Box display="flex" justifyContent="center" mt={3}>
          <Link to="/login" style={{ display: "flex", alignItems: "center", gap: 4, color: "#1565C0", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
            <ArrowBack fontSize="small" /> Volver al inicio de sesión
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
