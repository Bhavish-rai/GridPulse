
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes.js";
import databaseRoutes from "./routes/database.routes.js";
import authRoutes from "./routes/auth.routes.js";
import vehicleRoutes from "./routes/vehicle.routes.js";

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:1234",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the GridPulse API."
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.status ? err.message : "Internal server error."
  });
});

export default app;
