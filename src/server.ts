import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import routes from "./routes";
import prisma from "./config/database";
import logger from "./utils/logger";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env["PORT"] || "5000", 10);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const limiter = rateLimit({
  windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || "900000", 10), // 15 minutes
  max: parseInt(process.env["RATE_LIMIT_MAX_REQUESTS"] || "100", 10), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use(
  cors({
    origin: process.env["FRONTEND_URL"] || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env["NODE_ENV"] === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use("/api", routes);

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.database("Connected successfully");

    app.listen(PORT, () => {
      logger.server(`Running on port ${PORT}`);
      logger.startup(`Environment: ${process.env["NODE_ENV"]}`);
    });
  } catch (error) {
    logger.errorWithContext("Failed to start server", error as Error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.shutdown("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.shutdown("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

startServer().catch((error) => {
  logger.errorWithContext("Failed to start server", error as Error);
  process.exit(1);
});

export default app;
