import express, { Router } from "express";
import { AuthController } from "../controllers/authController";
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
  rateLimitMiddleware,
} from "../middleware/validation";
import auth from "../middleware/auth";

const router: Router = express.Router();

// Login route
router.post(
  "/login",
  rateLimitMiddleware,
  validateLogin,
  handleValidationErrors,
  AuthController.login,
);

// Logout route (protected)
router.post("/logout", auth, AuthController.logout);

// Registration routes
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  AuthController.register,
);

export default router;
