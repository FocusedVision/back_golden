import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { UnitTurnover as PrismaUnitTurnover } from "@prisma/client";

class UnitTurnover extends BaseModel<PrismaUnitTurnover> {
  constructor() {
    super("UnitTurnover");
  }

  async upsertMany(
    unitTurnovers: Omit<PrismaUnitTurnover, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      await this.model.createMany({
        data: unitTurnovers.map((unitTurnover) => ({
          ...unitTurnover,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${unitTurnovers.length} unit turnovers`);
    } catch (error) {
      logger.error("Error creating unit turnovers:", error);
      // throw error;
    }
  }
}

export default new UnitTurnover();
