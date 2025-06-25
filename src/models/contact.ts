import BaseModel from "./baseModel";
import logger from "../utils/logger";
import { Contact as PrismaContact } from "@prisma/client";

class Contact extends BaseModel<PrismaContact> {
  constructor() {
    super("contact");
  }

  async upsertMany(
    contacts: Omit<PrismaContact, "id" | "updatedAt">[],
  ): Promise<void> {
    try {
      // Since we want to track each touch as a separate record,
      // we'll use createMany with skipDuplicates
      await this.model.createMany({
        data: contacts.map((contact) => ({
          ...contact,
        })),
        skipDuplicates: true,
      });

      logger.info(`Successfully created ${contacts.length} contacts`);
    } catch (error) {
      logger.error("Error creating contacts:", error);
      throw error;
    }
  }
}

export default new Contact();
