import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Schedule,
  School,
  Accessibility,
  Web,
  MobileFriendly,
  ColorLens,
  Star,
  PlayCircle,
} from "@mui/icons-material";
import { coursesAPI } from "../services/api";

// Types for course data
interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration: number; // in minutes
  order_index: number;
  content_type: "video" | "reading" | "quiz" | "interactive";
  is_preview: boolean;
  video_url?: string;
  content_url?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor_name: string;
  instructor_rating?: number;
  duration: number; // total minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  total_students: number;
  category_name: string;
  category_color?: string;
  image_url?: string;
  tags: string[];
  price: number;
  is_published: boolean;
  created_at: string;
  lessons?: Lesson[];
  progress?: number; // 0-100 for enrolled courses
  isEnrolled?: boolean;
}

export const Learn: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Load courses and categories on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesResponse, categoriesResponse] = await Promise.all([
          coursesAPI.getAllCourses(),
          coursesAPI.getCategories(),
        ]);

        setCourses(coursesResponse.courses || []);
        setCategories(categoriesResponse.categories || []);
      } catch (err: any) {
        console.error("Error loading courses:", err);
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  const handleCourseClick = async (course: Course) => {
    try {
      // Get detailed course information including lessons
      const detailedCourse = await coursesAPI.getCourse(course.id);
      setSelectedCourse({
        ...course,
        lessons: detailedCourse.lessons || [],
        isEnrolled: detailedCourse.isEnrolled || false,
        progress: detailedCourse.enrollment?.progress || 0,
      });
    } catch (err) {
      console.error("Error loading course details:", err);
      setSelectedCourse(course);
    }
  };

  const handleCloseCourse = () => {
    setSelectedCourse(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "success";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "error";
      default:
        return "default";
    }
  };

  const filteredCourses =
    filter === "all"
      ? courses
      : courses.filter(
          (course) =>
            course.category_name.toLowerCase().includes(filter.toLowerCase()) ||
            course.tags.some((tag) =>
              tag.toLowerCase().includes(filter.toLowerCase())
            )
        );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && (
        <>
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              <School sx={{ mr: 2, fontSize: "inherit" }} />
              Learn Accessibility
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Master web and app accessibility through interactive courses,
              expert guidance, and hands-on practice.
            </Typography>

            {/* Category Filters */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
              <Chip
                label="All Courses"
                onClick={() => setFilter("all")}
                color={filter === "all" ? "primary" : "default"}
                variant={filter === "all" ? "filled" : "outlined"}
              />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  onClick={() => setFilter(category.name)}
                  color={filter === category.name ? "primary" : "default"}
                  variant={filter === category.name ? "filled" : "outlined"}
                  icon={
                    category.name === "Web Accessibility" ? (
                      <Web />
                    ) : category.name === "Mobile Accessibility" ? (
                      <MobileFriendly />
                    ) : category.name === "Design Principles" ? (
                      <ColorLens />
                    ) : (
                      <Accessibility />
                    )
                  }
                />
              ))}
            </Box>
          </Box>

          {/* Courses Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
              gap: 3,
              mb: 4,
            }}
          >
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 160,
                    background: `linear-gradient(135deg, ${
                      course.category_name === "Web Accessibility"
                        ? "#1976d2"
                        : course.category_name === "Mobile Accessibility"
                        ? "#9c27b0"
                        : course.category_name === "Design Principles"
                        ? "#ff9800"
                        : "#4caf50"
                    } 0%, ${
                      course.category_name === "Web Accessibility"
                        ? "#42a5f5"
                        : course.category_name === "Mobile Accessibility"
                        ? "#ba68c8"
                        : course.category_name === "Design Principles"
                        ? "#ffb74d"
                        : "#81c784"
                    } 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                >
                  {course.category_name === "Web Accessibility" && (
                    <Web sx={{ fontSize: 60 }} />
                  )}
                  {course.category_name === "Mobile Accessibility" && (
                    <MobileFriendly sx={{ fontSize: 60 }} />
                  )}
                  {course.category_name === "Design Principles" && (
                    <ColorLens sx={{ fontSize: 60 }} />
                  )}
                  {![
                    "Web Accessibility",
                    "Mobile Accessibility",
                    "Design Principles",
                  ].includes(course.category_name) && (
                    <Accessibility sx={{ fontSize: 60 }} />
                  )}
                </CardMedia>

                <CardContent
                  sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
                >
                  <Typography variant="h6" component="h3" gutterBottom>
                    {course.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ flexGrow: 1 }}
                  >
                    {course.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {course.instructor_name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {course.instructor_name}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Schedule sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {course.duration} min
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Star sx={{ fontSize: 16, color: "#ffc107" }} />
                        <Typography variant="body2">{course.rating}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {course.total_students.toLocaleString()} students
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                      <Chip
                        label={course.difficulty}
                        size="small"
                        color={getDifficultyColor(course.difficulty) as any}
                        variant="outlined"
                      />
                      <Chip
                        label={course.category_name}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {course.progress && course.progress > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2">Progress</Typography>
                          <Typography variant="body2">
                            {course.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={course.progress}
                        />
                      </Box>
                    )}
                  </Box>

                  <Button
                    variant={
                      course.progress && course.progress > 0
                        ? "outlined"
                        : "contained"
                    }
                    fullWidth
                    onClick={() => handleCourseClick(course)}
                  >
                    {!course.progress || course.progress === 0
                      ? "Start Course"
                      : course.progress === 100
                      ? "Review Course"
                      : "Continue Learning"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Course Detail Dialog */}
          <Dialog
            open={Boolean(selectedCourse)}
            onClose={handleCloseCourse}
            maxWidth="md"
            fullWidth
          >
            {selectedCourse && (
              <>
                <DialogTitle>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h5">{selectedCourse.title}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Rating
                        value={selectedCourse.rating}
                        precision={0.1}
                        readOnly
                        size="small"
                      />
                      <Typography variant="body2">
                        ({selectedCourse.rating})
                      </Typography>
                    </Box>
                  </Box>
                </DialogTitle>

                <DialogContent>
                  <Typography variant="body1" paragraph>
                    {selectedCourse.description}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Chip
                      label={`${selectedCourse.difficulty} Level`}
                      color={
                        getDifficultyColor(selectedCourse.difficulty) as any
                      }
                    />
                    <Chip
                      label={`${selectedCourse.duration} minutes`}
                      icon={<Schedule />}
                    />
                    <Chip
                      label={`${selectedCourse.total_students.toLocaleString()} students`}
                      icon={<School />}
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Course Content
                  </Typography>

                  <List>
                    {selectedCourse.lessons &&
                      selectedCourse.lessons.map((lesson, index) => (
                        <ListItem key={lesson.id} sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <PlayCircle color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography variant="body1">
                                  {index + 1}. {lesson.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {lesson.duration} min
                                </Typography>
                              </Box>
                            }
                            secondary="Lesson"
                          />
                        </ListItem>
                      ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedCourse.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </DialogContent>

                <DialogActions>
                  <Button onClick={handleCloseCourse}>Close</Button>
                  <Button variant="contained" onClick={handleCloseCourse}>
                    {selectedCourse.progress === 0
                      ? "Start Course"
                      : "Continue Learning"}
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </>
      )}
    </Container>
  );
};
