import prisma from "../config/database";

abstract class BaseModel<T = any> {
  protected tableName: string;
  protected model: any;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.model = (prisma as any)[this.tableName];

    if (!this.model) {
      throw new Error(
        `Model for table '${tableName}' not found in Prisma client`,
      );
    }
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({
      where: { id },
    });
  }

  async findAll(
    conditions: Record<string, any> = {},
    orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" },
    limit?: number,
    offset?: number,
  ): Promise<T[]> {
    const queryOptions: any = {
      where: conditions,
      orderBy,
    };

    if (limit) {
      queryOptions.take = limit;
    }

    if (offset) {
      queryOptions.skip = offset;
    }

    return await this.model.findMany(queryOptions);
  }

  async findOne(conditions: Record<string, any>): Promise<T | null> {
    return await this.model.findFirst({
      where: conditions,
    });
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    return await this.model.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
  ): Promise<T | null> {
    return await this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.delete({
      where: { id },
    });
  }

  async count(conditions: Record<string, any> = {}): Promise<number> {
    return await this.model.count({
      where: conditions,
    });
  }

  async exists(conditions: Record<string, any>): Promise<boolean> {
    const count = await this.model.count({
      where: conditions,
    });
    return count > 0;
  }

  async createMany(
    data: Omit<T, "id" | "createdAt" | "updatedAt">[],
  ): Promise<{ count: number }> {
    return await this.model.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async updateMany(
    conditions: Record<string, any>,
    data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>,
  ): Promise<{ count: number }> {
    return await this.model.updateMany({
      where: conditions,
      data,
    });
  }

  async deleteMany(
    conditions: Record<string, any>,
  ): Promise<{ count: number }> {
    return await this.model.deleteMany({
      where: conditions,
    });
  }
}

export default BaseModel;
