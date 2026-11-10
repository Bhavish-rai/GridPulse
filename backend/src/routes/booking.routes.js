import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

const isValidDate = (value) =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isPositiveNumber = (value) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value > 0;

// GET /api/bookings
// Retrieve bookings made by the logged-in user.
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("bookings")
      .select(`
        *,
        station:stations (
          station_name,
          address,
          city,
          charging_power_kw
        ),
        vehicle:vehicles (
          brand,
          model,
          registration_number
        )
      `)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully.",
      count: data.length,
      data: { bookings: data }
    });
  } catch (error) {
    console.error("Get bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve bookings."
    });
  }
});

// POST /api/bookings
// Create a new charging slot booking.
router.post("/", async (req, res) => {
  try {
    const {
      station_id,
      vehicle_id,
      start_at,
      end_at,
      estimated_energy_kwh
    } = req.body;

    if (
      !station_id ||
      !vehicle_id ||
      !start_at ||
      !end_at ||
      estimated_energy_kwh === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Station, vehicle, start time, end time and estimated energy are required."
      });
    }

    if (!isValidDate(start_at) || !isValidDate(end_at)) {
      return res.status(400).json({
        success: false,
        message: "Provide valid start and end dates in ISO 8601 format."
      });
    }

    const startDate = new Date(start_at);
    const endDate = new Date(end_at);

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Booking end time must be later than start time."
      });
    }

    if (!isPositiveNumber(estimated_energy_kwh)) {
      return res.status(400).json({
        success: false,
        message: "Estimated energy must be a positive number."
      });
    }

    // Verify that the selected vehicle belongs to this user.
    const { data: vehicle, error: vehicleError } = await req.supabase
      .from("vehicles")
      .select("id, user_id, battery_capacity")
      .eq("id", vehicle_id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (vehicleError) throw vehicleError;

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found. Add the vehicle to your account first."
      });
    }

    // Verify that the station exists and is available for public booking.
    const { data: station, error: stationError } = await req.supabase
      .from("stations")
      .select("id, owner_id, station_name, status, is_listed, price_per_kwh, charging_power_kw")
      .eq("id", station_id)
      .maybeSingle();

    if (stationError) throw stationError;

    if (!station || station.status !== "active" || !station.is_listed) {
      return res.status(404).json({
        success: false,
        message: "This charging station is not currently available."
      });
    }

    if (station.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own charging station."
      });
    }

    // Calculate the estimated cost on the server.
    const estimatedCost = Number(
      (estimated_energy_kwh * Number(station.price_per_kwh)).toFixed(2)
    );

    const { data: booking, error: bookingError } = await req.supabase
      .from("bookings")
      .insert({
        user_id: req.user.id,
        vehicle_id,
        station_id,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        estimated_energy_kwh,
        estimated_cost: estimatedCost,
        status: "pending"
      })
      .select()
      .single();

    if (bookingError) {
      // PostgreSQL exclusion constraint: overlapping station bookings.
      if (bookingError.code === "23P01") {
        return res.status(409).json({
          success: false,
          message: "This charging station already has a booking during the selected time slot."
        });
      }

      if (bookingError.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "A conflicting booking already exists."
        });
      }

      throw bookingError;
    }

    return res.status(201).json({
      success: true,
      message: "Charging slot booked successfully.",
      data: {
        booking,
        station: {
          station_name: station.station_name,
          charging_power_kw: station.charging_power_kw
        },
        estimated_cost: estimatedCost
      }
    });
  } catch (error) {
    console.error("Create booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking."
    });
  }
});

// GET /api/bookings/:id
// Retrieve one booking belonging to the logged-in user.
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("bookings")
      .select(`
        *,
        station:stations (
          station_name,
          address,
          city,
          state,
          charging_power_kw
        ),
        vehicle:vehicles (
          brand,
          model,
          registration_number
        )
      `)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Booking not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking retrieved successfully.",
      data: { booking: data }
    });
  } catch (error) {
    console.error("Get booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve booking."
    });
  }
});

// PATCH /api/bookings/:id/cancel
// Cancel an eligible booking through the secure database function.
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { data, error } = await req.supabase.rpc("cancel_booking", {
      p_booking_id: req.params.id
    });

    if (error) {
      if (
        error.message?.includes("cannot be cancelled") ||
        error.message?.includes("not found")
      ) {
        return res.status(400).json({
          success: false,
          message: "Booking not found or is no longer eligible for cancellation."
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: { booking: data }
    });
  } catch (error) {
    console.error("Cancel booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel booking."
    });
  }
});

export default router;