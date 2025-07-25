import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onToggleMode,
  isRegisterMode,
}) => {
  const { login, register, isLoading, error } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      // Clear field error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    // Register mode validations
    if (isRegisterMode) {
      if (!formData.name.trim()) {
        errors.name = "Name is required";
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      let success = false;

      if (isRegisterMode) {
        success = await register(
          formData.name,
          formData.email,
          formData.password
        );
      } else {
        success = await login(formData.email, formData.password);
      }

      if (success) {
        // Reset form on success
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            {isRegisterMode ? (
              <PersonAddIcon
                sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
              />
            ) : (
              <LoginIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            )}
            <Typography variant="h4" component="h1" gutterBottom>
              {isRegisterMode ? "Create Account" : "Welcome Back"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isRegisterMode
                ? "Sign up to get started with CSAccess"
                : "Sign in to your CSAccess account"}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {isRegisterMode && (
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                margin="normal"
                value={formData.name}
                onChange={handleChange("name")}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={isLoading}
                required
              />
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              variant="outlined"
              margin="normal"
              value={formData.email}
              onChange={handleChange("email")}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isLoading}
              required
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              margin="normal"
              value={formData.password}
              onChange={handleChange("password")}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={isLoading}
              required
              autoComplete={
                isRegisterMode ? "new-password" : "current-password"
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {isRegisterMode && (
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                variant="outlined"
                margin="normal"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: "bold",
              }}
            >
              {isLoading
                ? isRegisterMode
                  ? "Creating Account..."
                  : "Signing In..."
                : isRegisterMode
                ? "Create Account"
                : "Sign In"}
            </Button>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                or
              </Typography>
            </Divider>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {isRegisterMode
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={onToggleMode}
                  disabled={isLoading}
                  sx={{
                    textDecoration: "none",
                    fontWeight: "bold",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {isRegisterMode ? "Sign In" : "Sign Up"}
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
