import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { CustomerTouch as PrismaCustomerTouch } from "@prisma/client";

class CustomerTouch extends BaseModel<PrismaCustomerTouch> {
  constructor() {
    super("customerTouch");
  }

  async upsertMany(
    customerTouches: Omit<PrismaCustomerTouch, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since we want to track each touch as a separate record,
      // we'll use createMany with skipDuplicates
      await this.model.createMany({
        data: customerTouches.map((touch) => ({
          ...touch,
          // For manual touches, create a descriptive session ID
          gaSession:
            touch.gaSession ||
            `manual_${touch.source?.toLowerCase()}_${touch.action?.toLowerCase()}`,
        })),
        skipDuplicates: true,
      });

      logger.info(
        `Successfully created ${customerTouches.length} customer touches`,
      );
    } catch (error) {
      logger.error("Error creating customer touches:", error);
      throw error;
    }
  }
}

export default new CustomerTouch();
