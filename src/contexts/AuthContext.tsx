import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Types for provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("userData");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          // In a real app, you'd validate the token with your backend
          if (isValidToken(token)) {
            setUser(parsedUser);
          } else {
            // Token expired or invalid
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Simple token validation (in real app, verify with backend)
  const isValidToken = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  // Generate a simple JWT-like token (for demo purposes)
  const generateToken = (user: User): string => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        id: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      })
    );
    const signature = btoa("demo-signature"); // In real app, use proper signing
    return `${header}.${payload}.${signature}`;
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get stored users from localStorage (demo purposes)
      const storedUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]"
      );

      // Find user by email
      const foundUser = storedUsers.find((u: any) => u.email === email);

      if (!foundUser) {
        setError("User not found");
        return false;
      }

      // In a real app, you'd hash the password and compare with bcrypt
      if (foundUser.password !== password) {
        setError("Invalid password");
        return false;
      }

      // Create user object without password
      const userWithoutPassword: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
      };

      // Generate token
      const token = generateToken(userWithoutPassword);

      // Store in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(userWithoutPassword));

      setUser(userWithoutPassword);
      return true;
    } catch (error) {
      setError("Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get existing users
      const storedUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]"
      );

      // Check if user already exists
      if (storedUsers.some((u: any) => u.email === email)) {
        setError("User with this email already exists");
        return false;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In real app, hash this with bcrypt
        role: "user",
      };

      // Save to localStorage (in real app, save to database)
      storedUsers.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(storedUsers));

      // Auto-login after registration
      const userWithoutPassword: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      };

      const token = generateToken(userWithoutPassword);
      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(userWithoutPassword));

      setUser(userWithoutPassword);
      return true;
    } catch (error) {
      setError("Registration failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
