
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";

const app = express();

// Security middleware
app.use(helmet());

// Frontend-backend communication
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:1234",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Request parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan("dev"));

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the GridPulse API."
  });
});

// Health-check endpoint
app.use("/api/health", healthRoutes);

// Unknown endpoint handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : "Internal server error."
  });
});

export default app;
