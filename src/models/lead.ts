import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { Lead as PrismaLead } from "@prisma/client";

class Lead extends BaseModel<PrismaLead> {
  constructor() {
    super("lead");
  }

  async upsertMany(
    leads: Omit<PrismaLead, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since we want to track each touch as a separate record,
      // we'll use createMany with skipDuplicates
      await this.model.createMany({
        data: leads.map((lead) => ({
          ...lead,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${leads.length} leads`);
    } catch (error) {
      logger.error("Error creating leads:", error);
      throw error;
    }
  }
}

export default new Lead();
