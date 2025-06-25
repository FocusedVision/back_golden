import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { Payment as PrismaPayment } from "@prisma/client";

class Payment extends BaseModel<PrismaPayment> {
  constructor() {
    super("payment");
  }

  async upsertMany(
    payments: Omit<PrismaPayment, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since Payment model doesn't have unique constraints other than id,
      // we'll use createMany with skipDuplicates for bulk insertion
      await this.model.createMany({
        data: payments,
        skipDuplicates: true,
      });

      logger.info(`Successfully upserted ${payments.length} payments`);
    } catch (error) {
      logger.error("Error upserting payments:", error);
      throw error;
    }
  }
}

export default new Payment();
