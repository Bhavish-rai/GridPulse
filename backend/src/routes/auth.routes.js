
import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const router = Router();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All registration fields are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    if (!supabase) {
      return res.status(503).json({
        success: false,
        message: "Supabase is not configured."
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim()
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(201).json({
      success: true,
      message: data.session
        ? "Registration successful."
        : "Registration successful. Please verify your email.",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        },
        accessToken: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        requiresEmailConfirmation: !data.session
      }
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete registration."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete login."
    });
  }
});

// GET LOGGED-IN USER PROFILE
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const { data: profile, error } = await req.supabase
      .from("users")
      .select("id, full_name, email, phone, role, created_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile retrieval error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve user profile."
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: { profile }
    });
  } catch (error) {
    console.error("Profile route error:", error);

    return res.status(500).json({
      success: false,
      message: "Unexpected error occurred."
    });
  }
});

export default router;
