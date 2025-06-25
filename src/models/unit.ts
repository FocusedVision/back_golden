import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { Unit as PrismaUnit } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

class Unit extends BaseModel<PrismaUnit> {
  constructor() {
    super("unit");
  }

  async upsertMany(
    units: Omit<PrismaUnit, "id" | "createdAt" | "updatedAt">[],
  ): Promise<void> {
    try {
      for (const unit of units) {
        await this.model.upsert({
          where: { unitId: unit.unitId },
          update: {
            ...unit,
            updatedAt: new Date(),
          },
          create: unit,
        });
      }

      logger.info(`Successfully upserted ${units.length} units`);
    } catch (error) {
      logger.error("Error upserting units:", error);
      throw error;
    }
  }

  async findByFacilityId(facilityId: string): Promise<PrismaUnit[]> {
    return await this.findAll({ facilityId });
  }

  async findByUnitId(unitId: string): Promise<PrismaUnit | null> {
    return await this.findOne({ unitId });
  }

  async findAvailableUnits(facilityId?: string): Promise<PrismaUnit[]> {
    const conditions: any = { isLeased: 0, isRentable: 1 };
    if (facilityId) {
      conditions.facilityId = facilityId;
    }
    return await this.findAll(conditions);
  }

  async updateRates(
    facilityId: string,
    newRate: number,
  ): Promise<{ count: number }> {
    return await this.updateMany(
      { facilityId },
      { rateManaged: new Decimal(newRate) },
    );
  }
}

export default new Unit();
