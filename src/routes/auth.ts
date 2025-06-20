import express, { Router } from "express";
import { AuthController } from "../controllers/authController";
import {
  validateRegister,
  handleValidationErrors,
} from "../middleware/validation";

const router: Router = express.Router();

// Registration routes
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  AuthController.register,
);

export default router;
