import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  Card,
  CardContent,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <HomeIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CSAccess - Material-UI Demo
          </Typography>
          <Button color="inherit" startIcon={<SettingsIcon />}>
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            "& > *": {
              flex: "1 1 400px",
              minWidth: "300px",
            },
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Welcome to Material-UI!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Material-UI has been successfully installed and configured. You
                now have access to a comprehensive library of React components
                following Google's Material Design principles.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                  Primary Button
                </Button>
                <Button variant="outlined" color="secondary">
                  Secondary Button
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Quick Start
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Start building your application with Material-UI components:
              </Typography>
              <ul>
                <li>Use ThemeProvider for consistent styling</li>
                <li>Import components from @mui/material</li>
                <li>Add icons from @mui/icons-material</li>
                <li>Utilize responsive layouts with Box components</li>
              </ul>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
