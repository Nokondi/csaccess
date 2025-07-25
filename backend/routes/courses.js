const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Helper functions for database queries
function getAllCourses(db, filters = {}) {
  return new Promise((resolve, reject) => {
    let query = `
            SELECT 
                c.*,
                i.name as instructor_name,
                i.rating as instructor_rating,
                cat.name as category_name,
                cat.color as category_color
            FROM courses c
            LEFT JOIN instructors i ON c.instructor_id = i.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.is_published = 1
        `;

    const params = [];

    if (filters.category) {
      query += " AND cat.name = ?";
      params.push(filters.category);
    }

    if (filters.difficulty) {
      query += " AND c.difficulty = ?";
      params.push(filters.difficulty);
    }

    if (filters.search) {
      query += " AND (c.title LIKE ? OR c.description LIKE ?)";
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += " ORDER BY c.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));
    }

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse JSON fields
        const courses = rows.map((course) => ({
          ...course,
          tags: course.tags ? JSON.parse(course.tags) : [],
        }));
        resolve(courses);
      }
    });
  });
}

function getCourseById(db, courseId) {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                c.*,
                i.name as instructor_name,
                i.bio as instructor_bio,
                i.rating as instructor_rating,
                i.expertise as instructor_expertise,
                cat.name as category_name,
                cat.description as category_description,
                cat.color as category_color
            FROM courses c
            LEFT JOIN instructors i ON c.instructor_id = i.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ? AND c.is_published = 1
        `;

    db.get(query, [courseId], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Parse JSON fields
        const course = {
          ...row,
          tags: row.tags ? JSON.parse(row.tags) : [],
          instructor_expertise: row.instructor_expertise
            ? JSON.parse(row.instructor_expertise)
            : [],
        };
        resolve(course);
      } else {
        resolve(null);
      }
    });
  });
}

function getCourseLessons(db, courseId) {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT * FROM lessons
            WHERE course_id = ?
            ORDER BY order_index ASC
        `;

    db.all(query, [courseId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getUserEnrollment(db, userId, courseId) {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT * FROM enrollments
            WHERE user_id = ? AND course_id = ?
        `;

    db.get(query, [userId, courseId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function enrollUserInCourse(db, userId, courseId) {
  return new Promise((resolve, reject) => {
    const { v4: uuidv4 } = require("uuid");
    const enrollmentId = uuidv4();

    const stmt = db.prepare(`
            INSERT INTO enrollments (id, user_id, course_id, progress, last_accessed)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

    stmt.run([enrollmentId, userId, courseId, 0.0], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: enrollmentId, changes: this.changes });
      }
    });

    stmt.finalize();
  });
}

function getUserEnrollments(db, userId) {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT 
                e.*,
                c.title as course_title,
                c.description as course_description,
                c.difficulty as course_difficulty,
                c.duration as course_duration,
                c.image_url as course_image_url,
                i.name as instructor_name,
                cat.name as category_name
            FROM enrollments e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN instructors i ON c.instructor_id = i.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC
        `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function getCategories(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM categories ORDER BY name", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Public routes

// Get categories (must be before /:courseId route)
router.get("/meta/categories", async (req, res) => {
  try {
    const categories = await getCategories(req.db);
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get all courses
router.get("/", async (req, res) => {
  try {
    const { category, difficulty, search, limit } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;
    if (search) filters.search = search;
    if (limit) filters.limit = limit;

    const courses = await getAllCourses(req.db, filters);

    res.json({
      courses,
      total: courses.length,
      filters: filters,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get single course by ID
router.get("/:courseId", optionalAuth, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await getCourseById(req.db, courseId);
    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    // Get course lessons
    const lessons = await getCourseLessons(req.db, courseId);

    // If user is authenticated, check enrollment status
    let enrollment = null;
    if (req.user) {
      enrollment = await getUserEnrollment(req.db, req.user.userId, courseId);
    }

    res.json({
      course,
      lessons,
      enrollment,
      isEnrolled: !!enrollment,
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get course lessons
router.get("/:courseId/lessons", async (req, res) => {
  try {
    const { courseId } = req.params;

    // Verify course exists
    const course = await getCourseById(req.db, courseId);
    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    const lessons = await getCourseLessons(req.db, courseId);

    res.json({
      lessons,
      total: lessons.length,
    });
  } catch (error) {
    console.error("Get lessons error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Protected routes (require authentication)

// Enroll in course
router.post("/:courseId/enroll", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Verify course exists
    const course = await getCourseById(req.db, courseId);
    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    // Check if already enrolled
    const existingEnrollment = await getUserEnrollment(
      req.db,
      userId,
      courseId
    );
    if (existingEnrollment) {
      return res.status(400).json({
        error: "Already enrolled in this course",
      });
    }

    // Enroll user
    const enrollment = await enrollUserInCourse(req.db, userId, courseId);

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment: {
        id: enrollment.id,
        courseId,
        progress: 0.0,
        enrolledAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Enroll error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

// Get user's enrolled courses
router.get("/user/enrollments", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const enrollments = await getUserEnrollments(req.db, userId);

    res.json({
      enrollments,
      total: enrollments.length,
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
