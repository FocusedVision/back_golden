import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { RegisterRequest } from "../types";
import logger from "../utils/logger";

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Extract registration data from request body
      const registerData: RegisterRequest = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        confirmPassword: req.body.confirmPassword,
      };

      const result = await AuthService.register(registerData);

      if (result.success) {
        logger.success("User registration successful", {
          email: registerData.email,
          userId: result.data?.user?.id,
        });

        res.status(201).json(result);
      } else {
        logger.auth("User registration failed", {
          email: registerData.email,
          errors: result.errors,
        });

        res.status(400).json(result);
      }
    } catch (error) {
      logger.error("Registration controller error", error as Error, {
        email: req.body?.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: "Internal server error during registration",
      });
    }
  }
}
