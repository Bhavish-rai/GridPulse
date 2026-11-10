
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

// GET /api/stations/discover
// Discover listed and active charging stations.
router.get("/discover", async (req, res) => {
  try {
    const {
      city,
      state,
      station_type,
      connector,
      min_power,
      max_price,
      sort = "newest",
      page = "1",
      limit = "10"
    } = req.query;

    // Validate station type
    if (
      station_type &&
      !["public", "home"].includes(station_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Station type must be public or home."
      });
    }

    // Validate numeric filters
    const minPower = min_power === undefined
      ? null
      : Number(min_power);

    const maxPrice = max_price === undefined
      ? null
      : Number(max_price);

    if (
      minPower !== null &&
      (!Number.isFinite(minPower) || minPower < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum charging power must be a valid non-negative number."
      });
    }

    if (
      maxPrice !== null &&
      (!Number.isFinite(maxPrice) || maxPrice < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum price must be a valid non-negative number."
      });
    }

    // Validate pagination
    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer and limit must be between 1 and 50."
      });
    }

    const validSortOptions = {
      newest: { column: "created_at", ascending: false },
      price_low: { column: "price_per_kwh", ascending: true },
      price_high: { column: "price_per_kwh", ascending: false },
      power_high: { column: "charging_power_kw", ascending: false }
    };

    if (!validSortOptions[sort]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option. Use newest, price_low, price_high or power_high."
      });
    }

    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = req.supabase
      .from("stations")
      .select(
        `
          id,
          owner_id,
          station_name,
          station_type,
          address,
          city,
          state,
          postal_code,
          lat,
          lon,
          connector_types,
          charging_power_kw,
          price_per_kwh,
          peak_price_per_kwh,
          peak_start_time,
          peak_end_time,
          opening_time,
          closing_time,
          availability_days,
          status,
          created_at
        `,
        { count: "exact" }
      )
      .eq("is_listed", true)
      .eq("status", "active")
      .neq("owner_id", req.user.id);

    if (city) {
      query = query.ilike("city", `%${city.trim()}%`);
    }

    if (state) {
      query = query.ilike("state", `%${state.trim()}%`);
    }

    if (station_type) {
      query = query.eq("station_type", station_type);
    }

    if (connector) {
      query = query.contains("connector_types", [connector.trim()]);
    }

    if (minPower !== null) {
      query = query.gte("charging_power_kw", minPower);
    }

    if (maxPrice !== null) {
      query = query.lte("price_per_kwh", maxPrice);
    }

    const sortOption = validSortOptions[sort];

    const { data, error, count } = await query
      .order(sortOption.column, {
        ascending: sortOption.ascending
      })
      .range(from, to);

    if (error) {
      console.error("Station discovery database error:", error.message);
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Charging stations discovered successfully.",
      data: {
        stations: data,
        pagination: {
          currentPage: pageNumber,
          pageSize,
          totalStations: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        }
      }
    });
  } catch (error) {
    console.error("Station discovery error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to discover charging stations."
    });
  }
});

export default router;
