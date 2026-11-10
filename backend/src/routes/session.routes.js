import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

// GET /api/sessions
// Retrieve the logged-in user's charging session history.
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("charging_sessions")
      .select(`
        *,
        booking:bookings (
          id,
          start_at,
          end_at,
          station:stations (
            station_name,
            address,
            city
          ),
          vehicle:vehicles (
            brand,
            model,
            registration_number
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Charging sessions retrieved successfully.",
      count: data.length,
      data: { sessions: data }
    });
  } catch (error) {
    console.error("Get sessions error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve charging sessions."
    });
  }
});

// POST /api/sessions/start
// Start a simulated charging session for a booking.
router.post("/start", async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required."
      });
    }

    const { data, error } = await req.supabase.rpc(
      "start_charging_session",
      {
        p_booking_id: booking_id
      }
    );

    if (error) {
      if (
        error.message?.includes("not found") ||
        error.message?.includes("not eligible") ||
        error.message?.includes("already exists")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Charging session started successfully.",
      data: { session: data }
    });
  } catch (error) {
    console.error("Start session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to start charging session."
    });
  }
});

// PATCH /api/sessions/:id/end
// End a session and calculate the final charging cost.
router.patch("/:id/end", async (req, res) => {
  try {
    const { energy_consumed_kwh } = req.body;

    if (
      typeof energy_consumed_kwh !== "number" ||
      !Number.isFinite(energy_consumed_kwh) ||
      energy_consumed_kwh <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Energy consumed must be a positive number."
      });
    }

    const { data, error } = await req.supabase.rpc(
      "end_charging_session",
      {
        p_session_id: req.params.id,
        p_energy_consumed_kwh: energy_consumed_kwh
      }
    );

    if (error) {
      if (
        error.message?.includes("not found") ||
        error.message?.includes("not active") ||
        error.message?.includes("positive number")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Charging session completed successfully.",
      data: {
        session: data,
        final_cost: data.charging_cost
      }
    });
  } catch (error) {
    console.error("End session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to end charging session."
    });
  }
});

export default router;