const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Validation middleware
const validateRegister = [
  body("email").isEmail().normalizeEmail(),
  body("name").trim().isLength({ min: 2, max: 50 }),
  body("password").isLength({ min: 6 }),
];

const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").exists(),
];

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper function to get user by email
function getUserByEmail(db, email) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      [email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// Helper function to get user by ID
function getUserById(db, id) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, email, name, role, profile_image_url, created_at, last_login, email_verified FROM users WHERE id = ? AND is_active = 1",
      [id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

// Helper function to create user
function createUser(db, userData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
            INSERT INTO users (id, email, name, password_hash, role, email_verified, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

    stmt.run(
      [
        userData.id,
        userData.email,
        userData.name,
        userData.password_hash,
        userData.role || "user",
        userData.email_verified || false,
        true,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: userData.id, changes: this.changes });
        }
      }
    );

    stmt.finalize();
  });
}

// Helper function to update last login
function updateLastLogin(db, userId) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [userId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Helper function to save session
function saveSession(db, sessionData) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
            INSERT INTO user_sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

    stmt.run(
      [
        sessionData.id,
        sessionData.user_id,
        sessionData.token_hash,
        sessionData.expires_at,
        sessionData.ip_address,
        sessionData.user_agent,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );

    stmt.finalize();
  });
}

// Register endpoint
router.post("/register", validateRegister, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, name, password } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmail(req.db, email);
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists with this email address",
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const userData = {
      id: userId,
      email,
      name,
      password_hash,
      role: "user",
      email_verified: false,
    };

    await createUser(req.db, userData);

    // Generate JWT token
    const user = { id: userId, email, name, role: "user" };
    const token = generateToken(user);

    // Save session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await saveSession(req.db, {
      id: sessionId,
      user_id: userId,
      token_hash: await bcrypt.hash(token, 10),
      expires_at: expiresAt.toISOString(),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    // Update last login
    await updateLastLogin(req.db, userId);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error during registration",
    });
  }
});

// Login endpoint
router.post("/login", validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Get user by email
    const user = await getUserByEmail(req.db, email);
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Save session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await saveSession(req.db, {
      id: sessionId,
      user_id: user.id,
      token_hash: await bcrypt.hash(token, 10),
      expires_at: expiresAt.toISOString(),
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    // Update last login
    await updateLastLogin(req.db, user.id);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_image_url: user.profile_image_url,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error during login",
    });
  }
});

// Get current user endpoint
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.db, req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_image_url: user.profile_image_url,
        created_at: user.created_at,
        last_login: user.last_login,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Logout endpoint
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated implementation, you would invalidate the session
    // For now, we'll just return success (client should remove token)
    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Verify token endpoint
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
