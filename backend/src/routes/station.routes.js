
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

const editableFields = [
  "station_name",
  "station_type",
  "address",
  "city",
  "state",
  "postal_code",
  "lat",
  "lon",
  "connector_types",
  "charging_power_kw",
  "price_per_kwh",
  "peak_price_per_kwh",
  "peak_start_time",
  "peak_end_time",
  "opening_time",
  "closing_time",
  "availability_days",
  "is_listed"
];

const requiredFields = [
  "station_name",
  "station_type",
  "address",
  "city",
  "state",
  "postal_code",
  "connector_types",
  "charging_power_kw",
  "price_per_kwh"
];

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const validateStation = (body, isUpdate = false) => {
  if (!isUpdate) {
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return `${field.replaceAll("_", " ")} is required.`;
      }
    }
  }

  if (
    body.station_type !== undefined &&
    !["public", "home"].includes(body.station_type)
  ) {
    return "Station type must be either public or home.";
  }

  for (const field of [
    "station_name",
    "address",
    "city",
    "state",
    "postal_code"
  ]) {
    if (
      body[field] !== undefined &&
      (typeof body[field] !== "string" || !body[field].trim())
    ) {
      return `${field.replaceAll("_", " ")} must be a non-empty string.`;
    }
  }

  if (
    body.connector_types !== undefined &&
    (
      !Array.isArray(body.connector_types) ||
      body.connector_types.length === 0 ||
      !body.connector_types.every(
        (item) => typeof item === "string" && item.trim()
      )
    )
  ) {
    return "Connector types must be a non-empty array of strings.";
  }

  if (
    body.availability_days !== undefined &&
    (
      !Array.isArray(body.availability_days) ||
      !body.availability_days.every(
        (day) =>
          typeof day === "string" &&
          ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].includes(day)
      )
    )
  ) {
    return "Availability days must be an array of valid weekday names.";
  }

  for (const field of ["charging_power_kw", "price_per_kwh", "peak_price_per_kwh"]) {
    if (body[field] !== undefined && !isPositiveNumber(body[field])) {
      return `${field.replaceAll("_", " ")} must be a positive number.`;
    }
  }

  if (body.lat !== undefined && body.lat !== null) {
    if (
      typeof body.lat !== "number" ||
      !Number.isFinite(body.lat) ||
      body.lat < -90 ||
      body.lat > 90
    ) {
      return "Latitude must be a number between -90 and 90.";
    }
  }

  if (body.lon !== undefined && body.lon !== null) {
    if (
      typeof body.lon !== "number" ||
      !Number.isFinite(body.lon) ||
      body.lon < -180 ||
      body.lon > 180
    ) {
      return "Longitude must be a number between -180 and 180.";
    }
  }

  for (const field of [
    "peak_start_time",
    "peak_end_time",
    "opening_time",
    "closing_time"
  ]) {
    if (
      body[field] !== undefined &&
      body[field] !== null &&
      (
        typeof body[field] !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body[field])
      )
    ) {
      return `${field.replaceAll("_", " ")} must be a valid 24-hour time.`;
    }
  }

  if (
    body.is_listed !== undefined &&
    typeof body.is_listed !== "boolean"
  ) {
    return "is_listed must be true or false.";
  }

  if (
    body.price_per_kwh !== undefined &&
    body.peak_price_per_kwh !== undefined &&
    body.peak_price_per_kwh < body.price_per_kwh
  ) {
    return "Peak price cannot be lower than the regular price.";
  }

  return null;
};

const getAllowedFields = (body) => {
  const result = {};

  for (const field of editableFields) {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
  }

  for (const field of [
    "station_name",
    "address",
    "city",
    "state",
    "postal_code"
  ]) {
    if (typeof result[field] === "string") {
      result[field] = result[field].trim();
    }
  }

  if (Array.isArray(result.connector_types)) {
    result.connector_types = result.connector_types.map((item) => item.trim());
  }

  return result;
};

// GET /api/stations
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("stations")
      .select("*")
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Your stations were retrieved successfully.",
      count: data.length,
      data: { stations: data }
    });
  } catch (error) {
    console.error("Get stations error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your stations."
    });
  }
});

// POST /api/stations
router.post("/", async (req, res) => {
  try {
    const validationError = validateStation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const stationDetails = getAllowedFields(req.body);

    const { data, error } = await req.supabase
      .from("stations")
      .insert({
        ...stationDetails,
        owner_id: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Charging station registered successfully.",
      data: { station: data }
    });
  } catch (error) {
    console.error("Register station error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register charging station."
    });
  }
});

// GET /api/stations/:id
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("stations")
      .select("*")
      .eq("id", req.params.id)
      .eq("owner_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Station not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Station retrieved successfully.",
      data: { station: data }
    });
  } catch (error) {
    console.error("Get station error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve station."
    });
  }
});

// PATCH /api/stations/:id
router.patch("/:id", async (req, res) => {
  try {
    const updates = getAllowedFields(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid station field to update."
      });
    }

    const validationError = validateStation(updates, true);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const { data, error } = await req.supabase
      .from("stations")
      .update(updates)
      .eq("id", req.params.id)
      .eq("owner_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Station not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Station updated successfully.",
      data: { station: data }
    });
  } catch (error) {
    console.error("Update station error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update station."
    });
  }
});

export default router;
