import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { PricingGroup as PrismaPricingGroup } from "@prisma/client";

class PricingGroup extends BaseModel<PrismaPricingGroup> {
  constructor() {
    super("PricingGroup");
  }

  async upsertMany(
    pricingGroups: Omit<PrismaPricingGroup, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      await this.model.createMany({
        data: pricingGroups.map((pricingGroup) => ({
          ...pricingGroup,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${pricingGroups.length} pricing groups`);
    } catch (error) {
      logger.error("Error creating pricing groups:", error);
      throw error;
    }
  }
}

export default new PricingGroup();
