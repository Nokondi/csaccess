const express = require("express");
const { body, validationResult } = require("express-validator");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Helper functions
function updateUserProfile(db, userId, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push("name = ?");
      values.push(updates.name);
    }

    if (updates.profile_image_url !== undefined) {
      fields.push("profile_image_url = ?");
      values.push(updates.profile_image_url);
    }

    if (fields.length === 0) {
      resolve({ changes: 0 });
      return;
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    db.run(query, values, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes });
      }
    });
  });
}

function getUserStats(db, userId) {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                COUNT(e.id) as total_enrollments,
                COUNT(CASE WHEN e.completed_at IS NOT NULL THEN 1 END) as completed_courses,
                AVG(e.progress) as average_progress,
                MAX(e.last_accessed) as last_course_access
            FROM enrollments e
            WHERE e.user_id = ?
        `;

    db.get(query, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          totalEnrollments: row.total_enrollments || 0,
          completedCourses: row.completed_courses || 0,
          averageProgress: row.average_progress || 0,
          lastCourseAccess: row.last_course_access,
        });
      }
    });
  });
}

function getUserRecentActivity(db, userId, limit = 10) {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                'enrollment' as activity_type,
                c.title as course_title,
                c.id as course_id,
                e.enrolled_at as activity_date,
                'Enrolled in course' as description
            FROM enrollments e
            LEFT JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ?
            
            UNION ALL
            
            SELECT 
                'lesson_progress' as activity_type,
                c.title as course_title,
                c.id as course_id,
                lp.completed_at as activity_date,
                'Completed lesson: ' || l.title as description
            FROM lesson_progress lp
            LEFT JOIN lessons l ON lp.lesson_id = l.id
            LEFT JOIN courses c ON l.course_id = c.id
            WHERE lp.user_id = ? AND lp.completed = 1
            
            ORDER BY activity_date DESC
            LIMIT ?
        `;

    db.all(query, [userId, userId, limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Validation middleware
const validateProfileUpdate = [
  body("name").optional().trim().isLength({ min: 2, max: 50 }),
  body("profile_image_url").optional().isURL(),
];

// Protected routes (all require authentication)

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user stats
    const stats = await getUserStats(req.db, userId);

    // Get recent activity
    const recentActivity = await getUserRecentActivity(req.db, userId, 5);

    res.json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
      stats,
      recentActivity,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  validateProfileUpdate,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const userId = req.user.userId;
      const { name, profile_image_url } = req.body;

      const updates = {};
      if (name) updates.name = name;
      if (profile_image_url !== undefined)
        updates.profile_image_url = profile_image_url;

      const result = await updateUserProfile(req.db, userId, updates);

      if (result.changes === 0) {
        return res.status(400).json({
          error: "No valid fields to update",
        });
      }

      res.json({
        message: "Profile updated successfully",
        changes: result.changes,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
);

// Get user dashboard data
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user stats
    const stats = await getUserStats(req.db, userId);

    // Get recent activity
    const recentActivity = await getUserRecentActivity(req.db, userId, 10);

    // Get current enrollments with progress
    const enrollments = await new Promise((resolve, reject) => {
      const query = `
                SELECT 
                    e.*,
                    c.title as course_title,
                    c.description as course_description,
                    c.difficulty as course_difficulty,
                    c.duration as course_duration,
                    c.image_url as course_image_url,
                    i.name as instructor_name,
                    cat.name as category_name,
                    cat.color as category_color
                FROM enrollments e
                LEFT JOIN courses c ON e.course_id = c.id
                LEFT JOIN instructors i ON c.instructor_id = i.id
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE e.user_id = ? AND e.completed_at IS NULL
                ORDER BY e.last_accessed DESC
                LIMIT 5
            `;

      req.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    res.json({
      stats,
      recentActivity,
      currentEnrollments: enrollments,
      user: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get user's learning progress for a specific course
router.get("/progress/:courseId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    // Get enrollment
    const enrollment = await new Promise((resolve, reject) => {
      const query = `
                SELECT * FROM enrollments
                WHERE user_id = ? AND course_id = ?
            `;

      req.db.get(query, [userId, courseId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!enrollment) {
      return res.status(404).json({
        error: "Enrollment not found",
      });
    }

    // Get lesson progress
    const lessonProgress = await new Promise((resolve, reject) => {
      const query = `
                SELECT 
                    lp.*,
                    l.title as lesson_title,
                    l.order_index,
                    l.duration
                FROM lesson_progress lp
                LEFT JOIN lessons l ON lp.lesson_id = l.id
                WHERE lp.user_id = ? AND l.course_id = ?
                ORDER BY l.order_index ASC
            `;

      req.db.all(query, [userId, courseId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      enrollment,
      lessonProgress,
      totalLessons: lessonProgress.length,
      completedLessons: lessonProgress.filter((lp) => lp.completed).length,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
