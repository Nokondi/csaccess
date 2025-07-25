import React from "react";
import {
  Typography,
  Container,
  Button,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Dashboard as DashboardIcon,
  AccountCircle,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Card
        sx={{
          mb: 4,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: "2rem",
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome back, {user?.name}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {user?.email}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
                You're securely logged into your CSAccess dashboard
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          "& > *": {
            flex: "1 1 300px",
            minWidth: "300px",
          },
        }}
      >
        {/* Security Status Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <SecurityIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h5" component="h2">
                Security Status
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your account is protected with secure authentication.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label="Authenticated" color="success" size="small" />
              <Chip label="Session Active" color="primary" size="small" />
              <Chip label="Secure Connection" color="info" size="small" />
            </Box>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              startIcon={<SettingsIcon />}
            >
              Security Settings
            </Button>
          </CardContent>
        </Card>

        {/* User Information Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AccountCircle color="primary" sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h5" component="h2">
                Account Information
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {user?.name}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {user?.email}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Role
              </Typography>
              <Typography variant="body1">{user?.role || "User"}</Typography>
            </Box>
            <Button
              variant="outlined"
              sx={{ mt: 1 }}
              startIcon={<SettingsIcon />}
            >
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Dashboard Features Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <DashboardIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
              <Typography variant="h5" component="h2">
                Dashboard Features
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" paragraph>
              Explore the secure features available to you:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="text" sx={{ justifyContent: "flex-start" }}>
                📊 Analytics & Reports
              </Button>
              <Button variant="text" sx={{ justifyContent: "flex-start" }}>
                🔒 Access Management
              </Button>
              <Button variant="text" sx={{ justifyContent: "flex-start" }}>
                👥 User Administration
              </Button>
              <Button variant="text" sx={{ justifyContent: "flex-start" }}>
                ⚙️ System Settings
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Common actions you can perform:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Button variant="contained" color="primary" fullWidth>
                Create New Project
              </Button>
              <Button variant="outlined" color="secondary" fullWidth>
                View Recent Activity
              </Button>
              <Button variant="outlined" fullWidth>
                Download Reports
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
