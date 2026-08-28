import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1565C0",
      light: "#1E88E5",
      dark: "#0D47A1",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2E7D32",
      light: "#43A047",
      dark: "#1B5E20",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F0F4F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A2332",
      secondary: "#4A5568",
    },
    error: { main: "#D32F2F" },
    warning: { main: "#F57C00" },
    info: { main: "#0288D1" },
    success: { main: "#2E7D32" },
    divider: "rgba(0,0,0,0.08)",
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  shadows: [
    "none",
    "0px 1px 3px rgba(0,0,0,0.08)",
    "0px 2px 8px rgba(0,0,0,0.10)",
    "0px 4px 16px rgba(0,0,0,0.10)",
    "0px 6px 24px rgba(0,0,0,0.12)",
    "0px 8px 32px rgba(0,0,0,0.12)",
    ...Array(19).fill("0px 8px 32px rgba(0,0,0,0.12)"),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(21,101,192,0.25)" },
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            backgroundColor: "#F0F4F8",
            fontWeight: 700,
            color: "#1A2332",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(180deg, #0D47A1 0%, #1565C0 60%, #1E88E5 100%)",
          color: "#ffffff",
          borderRight: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "2px 8px",
          "&.Mui-selected": {
            backgroundColor: "rgba(255,255,255,0.2)",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.25)" },
          },
          "&:hover": { backgroundColor: "rgba(255,255,255,0.12)" },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: "rgba(255,255,255,0.85)", minWidth: 40 },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: { color: "#ffffff", fontWeight: 500, fontSize: "0.875rem" },
      },
    },
  },
});

export default theme;
