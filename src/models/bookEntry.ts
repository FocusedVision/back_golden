import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { BookEntry as PrismaBookEntry } from "@prisma/client";

class BookEntry extends BaseModel<PrismaBookEntry> {
  constructor() {
    super("bookEntry");
  }

  async upsertMany(
    bookEntries: Omit<PrismaBookEntry, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      await this.model.createMany({
        data: bookEntries.map((entry) => ({
          ...entry,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${bookEntries.length} book entries`);
    } catch (error) {
      logger.error("Error creating book entries:", error);
      throw error;
    }
  }
}

export default new BookEntry();
