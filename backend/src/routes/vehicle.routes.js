
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

// All vehicle routes require authentication.
router.use(authenticateUser);

const allowedFields = [
  "registration_number",
  "brand",
  "model",
  "battery_capacity",
  "connector_type"
];

const validateVehicle = (body, isUpdate = false) => {
  const {
    registration_number,
    brand,
    model,
    battery_capacity,
    connector_type
  } = body;

  if (!isUpdate) {
    if (
      !registration_number ||
      !brand ||
      !model ||
      battery_capacity === undefined ||
      !connector_type
    ) {
      return "Registration number, brand, model, battery capacity and connector type are required.";
    }
  }

  if (
    battery_capacity !== undefined &&
    (
      typeof battery_capacity !== "number" ||
      !Number.isFinite(battery_capacity) ||
      battery_capacity <= 0
    )
  ) {
    return "Battery capacity must be a positive number.";
  }

  for (const field of ["registration_number", "brand", "model", "connector_type"]) {
    if (
      body[field] !== undefined &&
      (typeof body[field] !== "string" || !body[field].trim())
    ) {
      return `${field.replaceAll("_", " ")} must be a non-empty string.`;
    }
  }

  return null;
};

// GET /api/vehicles
// Retrieve all vehicles belonging to the logged-in user.
router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully.",
      count: data.length,
      data: { vehicles: data }
    });
  } catch (error) {
    console.error("Get vehicles error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve vehicles."
    });
  }
});

// POST /api/vehicles
// Add a vehicle for the logged-in user.
router.post("/", async (req, res) => {
  try {
    const validationError = validateVehicle(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const vehicle = {
      registration_number: req.body.registration_number.trim().toUpperCase(),
      brand: req.body.brand.trim(),
      model: req.body.model.trim(),
      battery_capacity: req.body.battery_capacity,
      connector_type: req.body.connector_type.trim()
    };

    const { data, error } = await req.supabase
      .from("vehicles")
      .insert({
        ...vehicle,
        user_id: req.user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "A vehicle with this registration number already exists."
        });
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully.",
      data: { vehicle: data }
    });
  } catch (error) {
    console.error("Add vehicle error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to add vehicle."
    });
  }
});

// GET /api/vehicles/:id
// Retrieve one vehicle belonging to the logged-in user.
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("vehicles")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle retrieved successfully.",
      data: { vehicle: data }
    });
  } catch (error) {
    console.error("Get vehicle error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve vehicle."
    });
  }
});

// PATCH /api/vehicles/:id
// Update selected fields of the user's vehicle.
router.patch("/:id", async (req, res) => {
  try {
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update."
      });
    }

    const validationError = validateVehicle(updates, true);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    for (const field of ["registration_number", "brand", "model", "connector_type"]) {
      if (updates[field] !== undefined) {
        updates[field] = updates[field].trim();

        if (field === "registration_number") {
          updates[field] = updates[field].toUpperCase();
        }
      }
    }

    const { data, error } = await req.supabase
      .from("vehicles")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "A vehicle with this registration number already exists."
        });
      }

      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      data: { vehicle: data }
    });
  } catch (error) {
    console.error("Update vehicle error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle."
    });
  }
});

// DELETE /api/vehicles/:id
// Delete a vehicle belonging to the logged-in user.
router.delete("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("vehicles")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully."
    });
  } catch (error) {
    console.error("Delete vehicle error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete vehicle."
    });
  }
});

export default router;
