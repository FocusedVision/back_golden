import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { Lease as PrismaLease } from "@prisma/client";

class Lease extends BaseModel<PrismaLease> {
  constructor() {
    super("lease");
  }

  async upsertMany(
    leases: Omit<PrismaLease, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since we want to track each touch as a separate record,
      // we'll use createMany with skipDuplicates
      await this.model.createMany({
        data: leases.map((lease) => ({
          ...lease,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${leases.length} leases`);
    } catch (error) {
      logger.error("Error creating leases:", error);
      throw error;
    }
  }
}

export default new Lease();
