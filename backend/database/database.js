const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, "csaccess.db");
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(
        this.dbPath,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        async (err) => {
          if (err) {
            console.error("Error opening database:", err);
            reject(err);
            return;
          }

          console.log("Connected to SQLite database");
          await this.createTables();
          await this.seedData();
          resolve();
        }
      );
    });
  }

  async createTables() {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          console.error("Error creating tables:", err);
          reject(err);
        } else {
          console.log("Database tables created successfully");
          resolve();
        }
      });
    });
  }

  async seedData() {
    try {
      // Check if data already exists
      const hasData = await this.checkExistingData();
      if (hasData) {
        console.log("Database already has seed data, skipping...");
        return;
      }

      console.log("Seeding database with initial data...");

      // Create categories
      const categories = [
        {
          id: uuidv4(),
          name: "Web Accessibility",
          description: "Learn how to make websites accessible to all users",
          icon: "WebIcon",
          color: "#1976d2",
        },
        {
          id: uuidv4(),
          name: "Mobile Accessibility",
          description: "Mobile app accessibility best practices",
          icon: "PhoneIcon",
          color: "#388e3c",
        },
        {
          id: uuidv4(),
          name: "Design Principles",
          description: "Accessible design fundamentals",
          icon: "DesignIcon",
          color: "#f57c00",
        },
        {
          id: uuidv4(),
          name: "Screen Readers",
          description: "Understanding and optimizing for screen readers",
          icon: "VolumeUpIcon",
          color: "#7b1fa2",
        },
      ];

      // Create instructors
      const instructors = [
        {
          id: uuidv4(),
          name: "Dr. Sarah Johnson",
          email: "sarah.johnson@csaccess.com",
          bio: "Leading accessibility expert with 15+ years of experience in web accessibility and inclusive design.",
          expertise: JSON.stringify([
            "WCAG Guidelines",
            "Screen Reader Testing",
            "Inclusive Design",
          ]),
          rating: 4.9,
        },
        {
          id: uuidv4(),
          name: "Mike Chen",
          email: "mike.chen@csaccess.com",
          bio: "Senior developer specializing in accessible frontend development and ARIA implementation.",
          expertise: JSON.stringify([
            "HTML Semantics",
            "ARIA",
            "JavaScript Accessibility",
          ]),
          rating: 4.8,
        },
        {
          id: uuidv4(),
          name: "Lisa Rodriguez",
          email: "lisa.rodriguez@csaccess.com",
          bio: "UX designer focused on creating inclusive user experiences for people with disabilities.",
          expertise: JSON.stringify([
            "Inclusive Design",
            "User Research",
            "Accessibility Testing",
          ]),
          rating: 4.7,
        },
      ];

      // Insert categories
      for (const category of categories) {
        await this.insertCategory(category);
      }

      // Insert instructors
      for (const instructor of instructors) {
        await this.insertInstructor(instructor);
      }

      // Create courses
      const courses = [
        {
          id: uuidv4(),
          title: "Web Accessibility Fundamentals",
          description:
            "Learn the essential principles of web accessibility and how to implement WCAG guidelines in your projects.",
          instructor_id: instructors[0].id,
          category_id: categories[0].id,
          difficulty: "Beginner",
          duration: 180,
          rating: 4.8,
          total_students: 156,
          tags: JSON.stringify(["WCAG", "HTML", "CSS", "Fundamentals"]),
          is_published: true,
          price: 0.0,
        },
        {
          id: uuidv4(),
          title: "Advanced ARIA Techniques",
          description:
            "Master advanced ARIA patterns and create complex accessible components.",
          instructor_id: instructors[1].id,
          category_id: categories[0].id,
          difficulty: "Advanced",
          duration: 240,
          rating: 4.9,
          total_students: 89,
          tags: JSON.stringify([
            "ARIA",
            "JavaScript",
            "Components",
            "Advanced",
          ]),
          is_published: true,
          price: 0.0,
        },
        {
          id: uuidv4(),
          title: "Mobile App Accessibility",
          description:
            "Best practices for creating accessible mobile applications on iOS and Android.",
          instructor_id: instructors[2].id,
          category_id: categories[1].id,
          difficulty: "Intermediate",
          duration: 200,
          rating: 4.7,
          total_students: 134,
          tags: JSON.stringify([
            "Mobile",
            "iOS",
            "Android",
            "Touch Interfaces",
          ]),
          is_published: true,
          price: 0.0,
        },
        {
          id: uuidv4(),
          title: "Accessible Design Systems",
          description:
            "Build and maintain accessible design systems that scale across your organization.",
          instructor_id: instructors[2].id,
          category_id: categories[2].id,
          difficulty: "Intermediate",
          duration: 220,
          rating: 4.6,
          total_students: 78,
          tags: JSON.stringify(["Design Systems", "Components", "Consistency"]),
          is_published: true,
          price: 0.0,
        },
        {
          id: uuidv4(),
          title: "Screen Reader Testing",
          description:
            "Comprehensive guide to testing your applications with various screen readers.",
          instructor_id: instructors[0].id,
          category_id: categories[3].id,
          difficulty: "Intermediate",
          duration: 160,
          rating: 4.8,
          total_students: 112,
          tags: JSON.stringify([
            "Testing",
            "Screen Readers",
            "NVDA",
            "JAWS",
            "VoiceOver",
          ]),
          is_published: true,
          price: 0.0,
        },
        {
          id: uuidv4(),
          title: "Color and Contrast",
          description:
            "Understanding color accessibility, contrast ratios, and designing for color blindness.",
          instructor_id: instructors[2].id,
          category_id: categories[2].id,
          difficulty: "Beginner",
          duration: 120,
          rating: 4.5,
          total_students: 203,
          tags: JSON.stringify([
            "Color",
            "Contrast",
            "Visual Design",
            "Color Blindness",
          ]),
          is_published: true,
          price: 0.0,
        },
      ];

      // Insert courses
      for (const course of courses) {
        await this.insertCourse(course);
      }

      // Create sample lessons for the first course
      const lessons = [
        {
          id: uuidv4(),
          course_id: courses[0].id,
          title: "Introduction to Web Accessibility",
          description: "Overview of web accessibility and why it matters",
          content_type: "video",
          duration: 15,
          order_index: 1,
          is_preview: true,
        },
        {
          id: uuidv4(),
          course_id: courses[0].id,
          title: "Understanding WCAG Guidelines",
          description: "Deep dive into WCAG 2.1 principles and guidelines",
          content_type: "reading",
          duration: 25,
          order_index: 2,
          is_preview: false,
        },
        {
          id: uuidv4(),
          course_id: courses[0].id,
          title: "Semantic HTML",
          description: "Using proper HTML elements for accessibility",
          content_type: "video",
          duration: 30,
          order_index: 3,
          is_preview: false,
        },
        {
          id: uuidv4(),
          course_id: courses[0].id,
          title: "Knowledge Check",
          description: "Test your understanding of accessibility fundamentals",
          content_type: "quiz",
          duration: 10,
          order_index: 4,
          is_preview: false,
        },
      ];

      // Insert lessons
      for (const lesson of lessons) {
        await this.insertLesson(lesson);
      }

      // Create demo user
      const demoUser = {
        id: uuidv4(),
        email: "demo@csaccess.com",
        name: "Demo User",
        password_hash: await bcrypt.hash("demo123", 10),
        role: "user",
        email_verified: true,
        is_active: true,
      };

      await this.insertUser(demoUser);

      console.log("Database seeded successfully!");
      console.log("Demo user created: demo@csaccess.com / demo123");
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  }

  async checkExistingData() {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  async insertCategory(category) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO categories (id, name, description, icon, color)
                VALUES (?, ?, ?, ?, ?)
            `);
      stmt.run(
        [
          category.id,
          category.name,
          category.description,
          category.icon,
          category.color,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async insertInstructor(instructor) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO instructors (id, name, email, bio, expertise, rating)
                VALUES (?, ?, ?, ?, ?, ?)
            `);
      stmt.run(
        [
          instructor.id,
          instructor.name,
          instructor.email,
          instructor.bio,
          instructor.expertise,
          instructor.rating,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async insertCourse(course) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO courses (id, title, description, instructor_id, category_id, difficulty, duration, rating, total_students, tags, is_published, price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(
        [
          course.id,
          course.title,
          course.description,
          course.instructor_id,
          course.category_id,
          course.difficulty,
          course.duration,
          course.rating,
          course.total_students,
          course.tags,
          course.is_published,
          course.price,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async insertLesson(lesson) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO lessons (id, course_id, title, description, content_type, duration, order_index, is_preview)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(
        [
          lesson.id,
          lesson.course_id,
          lesson.title,
          lesson.description,
          lesson.content_type,
          lesson.duration,
          lesson.order_index,
          lesson.is_preview,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async insertUser(user) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO users (id, email, name, password_hash, role, email_verified, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
      stmt.run(
        [
          user.id,
          user.email,
          user.name,
          user.password_hash,
          user.role,
          user.email_verified,
          user.is_active,
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  getDb() {
    return this.db;
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error("Error closing database:", err);
          } else {
            console.log("Database connection closed");
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
