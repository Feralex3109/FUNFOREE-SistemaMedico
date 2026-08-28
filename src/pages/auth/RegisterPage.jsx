import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  keyframes,
  MenuItem,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LocalHospital,
  ArrowForward,
  Person,
  Badge,
  Google,
} from "@mui/icons-material";
import { registerUser, loginWithGoogle } from "../../firebase/auth";

const schema = yup.object({
  displayName: yup.string().required("El nombre es requerido"),
  role: yup.string().required("El rol es requerido"),
  email: yup.string().email("Correo inválido").required("El correo es requerido"),
  password: yup.string().min(6, "Mínimo 6 caracteres").required("La contraseña es requerida"),
});

// Animations
const float1 = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -50px) scale(1.1); }
  100% { transform: translate(0, 0) scale(1); }
`;
const float2 = keyframes`
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, 40px) scale(0.9); }
  100% { transform: translate(0, 0) scale(1); }
`;
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.2); }
  70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
`;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: "admin" }
  });

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      // registerUser receives email, password, and userData object
      await registerUser(data.email, data.password, {
        displayName: data.displayName,
        role: data.role,
      });
      // After successful registration, we redirect to dashboard
      // The auth state listener in AuthContext will log them in automatically
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "Este correo ya está registrado"
          : err.code === "auth/weak-password"
          ? "La contraseña es muy débil"
          : err.message || "Error al registrar el usuario";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Error al registrarse con Google");
      }
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
        background: "#0A192F",
        backgroundImage: "radial-gradient(at 0% 0%, rgba(21, 101, 192, 0.6) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(30, 136, 229, 0.5) 0px, transparent 50%)",
        position: "relative",
        overflow: "hidden",
        px: 2,
        py: 4,
      }}
    >
      {/* Animated Background Orbs */}
      <Box
        sx={{
          position: "absolute",
          width: 600,
          height: 600,
          background: "linear-gradient(135deg, #1565C0, #42A5F5)",
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: 0.3,
          top: "-10%",
          left: "-5%",
          animation: `${float1} 15s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 500,
          height: 500,
          background: "linear-gradient(135deg, #0288D1, #29B6F6)",
          borderRadius: "50%",
          filter: "blur(80px)",
          opacity: 0.25,
          bottom: "-10%",
          right: "-5%",
          animation: `${float2} 18s ease-in-out infinite`,
        }}
      />
      
      {/* Decorator Lines */}
      <Box sx={{ position: "absolute", width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      {/* Centered Register Card */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 4,
          p: { xs: 4, sm: 5 },
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
          zIndex: 1,
          overflow: "hidden"
        }}
      >
        <Box sx={{ position: "absolute", top: 0, left: "20%", width: "60%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              mx: "auto",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.1))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              animation: `${pulse} 2s infinite`,
            }}
          >
            <LocalHospital sx={{ fontSize: 32, color: "#90CAF9" }} />
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", letterSpacing: "-0.5px", mb: 0.5 }}>
            Registrarse
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 400 }}>
            Crea una cuenta para probar el sistema
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, background: "rgba(211, 47, 47, 0.15)", color: "#FFCDD2", border: "1px solid rgba(211, 47, 47, 0.3)", "& .MuiAlert-icon": { color: "#EF5350" } }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              placeholder="Nombre completo"
              fullWidth
              {...register("displayName")}
              error={!!errors.displayName}
              helperText={errors.displayName?.message}
              variant="outlined"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "rgba(255,255,255,0.6)", fontSize: 22 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  {...field}
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  variant="outlined"
                  sx={inputStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge sx={{ color: "rgba(255,255,255,0.6)", fontSize: 22 }} />
                      </InputAdornment>
                    ),
                  }}
                >
                  <MenuItem value="admin">Administrador (Acceso Total)</MenuItem>
                  <MenuItem value="medico">Médico (Módulos Clínicos)</MenuItem>
                  <MenuItem value="administrativo">Administrativo (Módulos Operativos)</MenuItem>
                </TextField>
              )}
            />

            <TextField
              placeholder="Correo electrónico"
              type="email"
              fullWidth
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              variant="outlined"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "rgba(255,255,255,0.6)", fontSize: 22 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              placeholder="Contraseña"
              type={showPass ? "text" : "password"}
              fullWidth
              {...register("password")}
              error={!!errors.password}
              helperText={errors.password?.message}
              variant="outlined"
              sx={inputStyles}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "rgba(255,255,255,0.6)", fontSize: 22 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPass(!showPass)} edge="end" sx={{ color: "rgba(255,255,255,0.6)" }}>
                      {showPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
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
              endIcon={!loading && <ArrowForward />}
              sx={{
                py: 1.8,
                fontSize: "1.05rem",
                fontWeight: 700,
                mt: 1,
                borderRadius: 2,
                color: "#fff",
                background: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)",
                boxShadow: "0 8px 24px rgba(21,101,192,0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1976D2 0%, #2196F3 100%)",
                  boxShadow: "0 12px 32px rgba(21,101,192,0.6)",
                  transform: "translateY(-2px)",
                },
                "&:disabled": {
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.3)"
                },
                transition: "all 0.3s ease",
              }}
            >
              {loading ? <CircularProgress size={26} sx={{ color: "#fff" }} /> : "Crear Cuenta"}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: 3, mb: 3, display: "flex", alignItems: "center" }}>
          <Divider sx={{ flexGrow: 1, borderColor: "rgba(255,255,255,0.1)" }} />
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", px: 2 }}>O</Typography>
          <Divider sx={{ flexGrow: 1, borderColor: "rgba(255,255,255,0.1)" }} />
        </Box>

        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={handleGoogleLogin}
          disabled={loading}
          startIcon={<Google />}
          sx={{
            py: 1.5,
            fontSize: "1rem",
            fontWeight: 700,
            borderRadius: 2,
            color: "#fff",
            borderColor: "rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.02)",
            "&:hover": {
              background: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.4)",
            },
            transition: "all 0.3s ease",
          }}
        >
          Continuar con Google
        </Button>

        <Divider sx={{ mt: 4, mb: 3, borderColor: "rgba(255,255,255,0.1)" }} />
        
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              style={{ color: "#90CAF9", fontWeight: 700, textDecoration: "none" }}
            >
              Inicia sesión aquí
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// Reusable input styles
const inputStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "rgba(255,255,255,0.04)",
    borderRadius: 2,
    color: "#fff",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#64B5F6" },
  },
  "& .MuiFormHelperText-root": { color: "#FFCDD2", mx: 0 },
  "& .MuiSelect-icon": { color: "rgba(255,255,255,0.6)" },
};
