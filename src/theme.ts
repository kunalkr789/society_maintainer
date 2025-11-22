import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
  primary: { main: '#2E7D32' },   // forest green
  secondary: { main: '#81D4FA' }, // sky blue
  background: { default: '#E8F5E9', paper: '#FFFFFF' },
  text: { primary: '#263238', secondary: '#37474F' },
  error: { main: '#C62828' },
  warning: { main: '#FBC02D' },
  success: { main: '#388E3C' }
},
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } }
  },
  typography: { fontFamily: 'Inter, system-ui, Segoe UI, Roboto, Arial, sans-serif' }
})
