import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { GaEvent as PrismaGaEvent } from "@prisma/client";

class GaEvent extends BaseModel<PrismaGaEvent> {
  constructor() {
    super("gaEvent");
  }

  async upsertMany(
    gaEvents: Omit<PrismaGaEvent, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since we want to track each touch as a separate record,
      // we'll use createMany with skipDuplicates
      await this.model.createMany({
        data: gaEvents.map((gaEvent) => ({
          ...gaEvent,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${gaEvents.length} GA events`);
    } catch (error) {
      logger.error("Error creating GA events:", error);
      throw error;
    }
  }
}

export default new GaEvent();
