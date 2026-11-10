
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GridPulse API is running successfully.",
    data: {
      application: "GridPulse",
      status: "healthy",
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
