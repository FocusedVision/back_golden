import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import routes from "./routes";
import prisma from "./config/database";
import logger from "./utils/logger";
import { scheduleJob } from "node-schedule";
import { BigQuerySyncService } from "./services";

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env["PORT"] || "5000", 10);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const limiter = rateLimit({
  windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || "900000", 10),
  max: parseInt(process.env["RATE_LIMIT_MAX_REQUESTS"] || "100", 10),
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

async function executeScheduledJob(
  jobName: string,
  jobFunction: () => Promise<any>,
) {
  logger.info(`Starting scheduled ${jobName}...`);
  try {
    const result = await jobFunction();
    logger.info(
      `Successfully completed ${jobName}${result ? `: ${result}` : ""}`,
    );
  } catch (error) {
    logger.error(`Failed to complete ${jobName}:`, {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
}

function scheduleBigQueryJobs() {
  const syncService = new BigQuerySyncService();
  scheduleJob("0 * * * *", () =>
    executeScheduledJob("unit occupancy refresh", async () => {
      await syncService.getUnits();
      return `Processed units sync`;
    }),
  );

  scheduleJob("0 */6 * * *", () =>
    executeScheduledJob("payment data refresh", async () => {
      await syncService.getPayments();
      return `Processed recent payments sync`;
    }),
  );

  scheduleJob("0 0 * * *", () =>
    executeScheduledJob("customer interactions refresh", async () => {
      await syncService.getCustomerTouches();
      return `Processed customer interactions sync`;
    }),
  );

  scheduleJob("* */12 * * *", () =>
    executeScheduledJob("book entries refresh", async () => {
      await syncService.getBookEntries();
      return `Processed book entries sync`;
    }),
  );

  scheduleJob("0 1 * * *", () =>
    executeScheduledJob("contact information refresh", async () => {
      await syncService.getContacts();
      return `Refreshed data for contacts`;
    }),
  );

  scheduleJob("0 */4 * * *", () =>
    executeScheduledJob("GA events refresh", async () => {
      await syncService.getGAEvents();
      return `Refreshed data for GA events`;
    }),
  );

  scheduleJob("0 */6 * * *", () =>
    executeScheduledJob("leads refresh", async () => {
      await syncService.getLeads();
      return `Refreshed data for leads`;
    }),
  );

  scheduleJob("0 */12 * * *", () =>
    executeScheduledJob("leases refresh", async () => {
      await syncService.getLeases();
      return `Refreshed data for leases`;
    }),
  );

  scheduleJob('0 2 * * *', () =>
    executeScheduledJob("managers refresh", async () => {
      await syncService.getManagers();
      return `Refreshed data for managers`;
    }),
  );

  scheduleJob('0 3 * * *', () =>
    executeScheduledJob("pricing groups refresh", async () => {
      await syncService.getPricingGroups();
      return `Refreshed data for pricing groups`;
    }),
  );

  scheduleJob('0 4 * * *', () =>
    executeScheduledJob("spaces historical data refresh", async () => {
      await syncService.getSpacesHistorical();
      return `Refreshed data for historical spaces`;
    }),
  );

  scheduleJob('0 5 * * *', () =>
    executeScheduledJob("unit turnover refresh", async () => {
      await syncService.getUnitTurnover();
      return `Refreshed data for unit turnovers`;
    }),
  );
}

async function startServer(): Promise<void> {
  try {
    await prisma.$connect();
    logger.database("Connected successfully");

    scheduleBigQueryJobs();

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
