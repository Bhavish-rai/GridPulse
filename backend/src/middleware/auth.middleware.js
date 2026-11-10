
import { supabase, createAuthenticatedClient } from "../config/supabase.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required."
      });
    }

    const token = authorization.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token."
      });
    }

    req.user = data.user;
    req.accessToken = token;
    req.supabase = createAuthenticatedClient(token);

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication verification failed."
    });
  }
};
