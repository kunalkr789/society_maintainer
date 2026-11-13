import { alpha, createTheme } from "@mui/material/styles";

// Green stays the society's identity colour; surfaces move to calm neutrals so
// status colours (paid / pending / overdue) carry the meaning on each screen.
const brand = "#15803D";
const ink = "#0F172A";
const muted = "#475569";
const line = "#E2E8F0";

export const theme = createTheme({
  palette: {
    primary: { main: brand, dark: "#166534", light: "#22C55E", contrastText: "#fff" },
    secondary: { main: "#0369A1" },
    success: { main: "#15803D" },
    warning: { main: "#B45309" },
    error: { main: "#B91C1C" },
    info: { main: "#0369A1" },
    background: { default: "#F6F7F9", paper: "#FFFFFF" },
    text: { primary: ink, secondary: muted },
    divider: line,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter Variable", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    overline: { fontWeight: 700, letterSpacing: "0.08em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: "antialiased" },
        // keep content clear of the iOS home indicator under the bottom bar
        "#root": { minHeight: "100dvh" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, paddingInline: 16 }, sizeLarge: { minHeight: 48 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${line}`, borderRadius: 16 } },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiCardContent: { styleOverrides: { root: { padding: 20, "&:last-child": { paddingBottom: 20 } } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } } },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: { root: { backgroundColor: alpha("#FFFFFF", 0.9), backdropFilter: "blur(8px)", borderBottom: `1px solid ${line}` } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginInline: 8,
          "&.Mui-selected": { backgroundColor: alpha(brand, 0.1), color: brand, "& .MuiListItemIcon-root": { color: brand } },
          "&.Mui-selected:hover": { backgroundColor: alpha(brand, 0.14) },
        },
      },
    },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 38, color: muted } } },
    MuiBottomNavigationAction: {
      styleOverrides: { root: { minWidth: 0, "&.Mui-selected": { color: brand } }, label: { fontSize: 11, "&.Mui-selected": { fontSize: 11, fontWeight: 700 } } },
    },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, color: muted, backgroundColor: "#F8FAFC" } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});
