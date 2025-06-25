import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { SpacesHistorical as PrismaSpacesHistorical } from "@prisma/client";

class SpacesHistorical extends BaseModel<PrismaSpacesHistorical> {
  constructor() {
    super("SpacesHistorical");
  }

  async upsertMany(
    spacesHistorical: Omit<PrismaSpacesHistorical, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      await this.model.createMany({
        data: spacesHistorical.map((spacesHistorical) => ({
          ...spacesHistorical,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${spacesHistorical.length} spaces historical`);
    } catch (error) {
      logger.error("Error creating spaces historical:", error);
      throw error;
    }
  }
}

export default new SpacesHistorical();
