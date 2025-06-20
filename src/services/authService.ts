import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {
  RegisterRequest,
  RegisterResponse,
  RegisterFlow,
  RegisterStatus,
  SafeUser,
  UserRole,
  JWTPayload,
} from "../types";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_EXPIRY = "7d";

  static async register(request: RegisterRequest): Promise<RegisterResponse> {
    logger.auth("Starting user registration process", { email: request.email });

    try {
      const flow: RegisterFlow = {
        request,
        validation: { isValid: false, errors: [] },
        status: RegisterStatus.PENDING,
      };

      await this.checkUserExists(request.email);

      const hashedPassword = await this.hashPassword(request.password);

      const user = await this.createUser({
        email: request.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: request.firstName?.trim() || null,
        lastName: request.lastName?.trim() || null,
      });

      const token = this.generateToken(user);

      const userData = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role as UserRole,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };

      flow.status = RegisterStatus.SUCCESS;
      const response: RegisterResponse = {
        success: true,
        message: "User registered successfully",
        data: userData,
      };
      flow.response = response;

      logger.success("User registration completed successfully", {
        userId: user.id,
        email: user.email,
      });

      return response;
    } catch (error) {
      logger.error("Registration failed", error as Error, {
        email: request.email,
      });
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: "Registration failed due to an unexpected error",
      };
    }
  }

  private static async checkUserExists(email: string): Promise<void> {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      logger.auth("Registration attempt with existing email", { email });
      throw new Error("An account with this email already exists");
    }
  }

  private static async hashPassword(password: string): Promise<string> {
    try {
      logger.auth("Hashing password for new user");
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error("Password hashing failed", error as Error);
      throw new Error("Failed to secure password");
    }
  }

  private static async createUser(userData: {
    email: string;
    password: string;
    firstName: string | null;
    lastName: string | null;
  }) {
    try {
      logger.database("Creating new user in database", {
        email: userData.email,
      });

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: UserRole.USER,
          isActive: true,
        },
      });

      logger.database("User created successfully", { userId: user.id });
      return user;
    } catch (error) {
      logger.error("Database user creation failed", error as Error);
      throw new Error("Failed to create user account");
    }
  }

  private static generateToken(user: SafeUser | any): string {
    try {
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const secret = process.env["JWT_SECRET"];
      if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      logger.auth("Generating JWT token for user", { userId: user.id });
      return jwt.sign(payload, secret, { expiresIn: this.JWT_EXPIRY });
    } catch (error) {
      logger.error("JWT token generation failed", error as Error);
      throw new Error("Failed to generate authentication token");
    }
  }
}
