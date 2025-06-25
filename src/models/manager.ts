import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { Manager as PrismaManager } from "@prisma/client";

class Manager extends BaseModel<PrismaManager> {
  constructor() {
    super("manager");
  }

  async upsertMany(
    managers: Omit<PrismaManager, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since we want to track each touch as a separate record,
      // we'll use createMany with skipDuplicates
      await this.model.createMany({
        data: managers.map((manager) => ({
          ...manager,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${managers.length} managers`);
    } catch (error) {
      logger.error("Error creating managers:", error);
      throw error;
    }
  }
}

export default new Manager();
