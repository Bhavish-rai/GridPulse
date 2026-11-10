
import { Router } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

router.get("/connection", async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Supabase configuration is missing. Check backend/.env."
      });
    }

    const { error } = await supabase
      .from("stations")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error.message);

      return res.status(503).json({
        success: false,
        message: "Unable to query the Supabase database.",
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "GridPulse backend is connected to Supabase successfully.",
      data: {
        database: "Supabase PostgreSQL",
        table: "stations",
        status: "connected"
      }
    });
  } catch (error) {
    console.error("Database test failed:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while testing the database."
    });
  }
});

export default router;
