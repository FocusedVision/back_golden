import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import { JWTPayload, AuthenticatedRequest } from "../types";
import logger from "../utils/logger";

const auth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env["JWT_SECRET"]!,
      ) as JWTPayload;

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Token is not valid. User not found.",
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: "Account is deactivated.",
        });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Token is not valid.",
      });
    }
  } catch (error) {
    logger.errorWithContext("Auth middleware error", error as Error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default auth;
