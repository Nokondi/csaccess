function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Handle specific error types
  if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(400).json({
      error: "Duplicate entry - record already exists",
      code: "DUPLICATE_ENTRY",
    });
  }

  if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
    return res.status(400).json({
      error: "Invalid reference - related record not found",
      code: "INVALID_REFERENCE",
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation failed",
      details: err.details || err.message,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: "Unauthorized access",
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON in request body",
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
