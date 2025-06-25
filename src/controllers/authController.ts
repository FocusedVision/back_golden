import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { RegisterRequest, AuthenticatedRequest } from "../types";
import logger from "../utils/logger";

export class AuthController {
  /**
   * Login user
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, remember = false } = req.body;

      const result = await AuthService.login(email, password, remember);

      if (result.success) {
        logger.success("User login successful", {
          email,
          userId: result.data?.user?.id,
        });

        res.json(result);
      } else {
        logger.auth("User login failed", {
          email,
          message: result.message,
        });

        res.status(401).json(result);
      }
    } catch (error) {
      logger.error("Login controller error", error as Error, {
        email: req.body?.email,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: "Internal server error during login",
      });
    }
  }

  /**
   * Logout user
   */
  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.auth("User logout", {
        userId: req.user?.userId,
        email: req.user?.email,
      });

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Logout controller error", error as Error, {
        userId: req.user?.userId,
        ip: req.ip,
      });

      res.status(500).json({
        success: false,
        message: "Internal server error during logout",
      });
    }
  }

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

        res.json(result);
      } else {
        logger.auth("User registration failed", {
          email: registerData.email,
          errors: result.errors,
        });

        res.json(result);
      }
    } catch (error) {
      logger.error("Registration controller error", error as Error, {
        email: req.body?.email,
        ip: req.ip,
      });

      res.json({
        success: false,
        message: "Internal server error during registration",
      });
    }
  }
}
