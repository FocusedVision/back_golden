import { Request } from "express";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse
  extends ApiResponse<{
    user: SafeUser;
    token: string;
    refreshToken?: string;
    expiresIn: number;
  }> {}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
}

export interface RegisterResponse
  extends ApiResponse<{
    user: SafeUser;
    token: string;
  }> {}

export interface RegisterValidationRules {
  email: {
    required: true;
    format: "email";
    unique: true;
  };
  password: {
    required: true;
    minLength: 6;
    pattern: string;
  };
  firstName: {
    required: false;
    minLength: 1;
    maxLength: 50;
    pattern: string;
  };
  lastName: {
    required: false;
    minLength: 1;
    maxLength: 50;
    pattern: string;
  };
}

export interface RegisterError {
  field: keyof RegisterRequest;
  code: string;
  message: string;
}

export enum RegisterErrorCode {
  EMAIL_REQUIRED = "EMAIL_REQUIRED",
  EMAIL_INVALID = "EMAIL_INVALID",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  PASSWORD_REQUIRED = "PASSWORD_REQUIRED",
  PASSWORD_TOO_SHORT = "PASSWORD_TOO_SHORT",
  PASSWORD_WEAK = "PASSWORD_WEAK",
  FIRST_NAME_TOO_LONG = "FIRST_NAME_TOO_LONG",
  LAST_NAME_TOO_LONG = "LAST_NAME_TOO_LONG",
  FIRST_NAME_INVALID = "FIRST_NAME_INVALID",
  LAST_NAME_INVALID = "LAST_NAME_INVALID",
}

export interface RegisterSuccessData {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
  };
  token: string;
  expiresIn: string;
}

export enum RegisterStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export interface RegisterFlow {
  request: RegisterRequest;
  validation: {
    isValid: boolean;
    errors: RegisterError[];
  };
  status: RegisterStatus;
  response?: RegisterResponse;
}

export interface PasswordStrength {
  score: number;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMinLength: boolean;
  feedback: string[];
}

export interface RegisterRateLimit {
  maxAttemptsPerHour: number;
  maxAttemptsPerDay: number;
  currentAttempts: number;
  resetTime: Date;
  isBlocked: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
