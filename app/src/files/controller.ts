import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { files } from '../../db/schema';
import type { Newfile } from '../../db/schema';
import type { GetUserFilesResponse } from '../../types/api';

export class FileController {
  constructor(private db: Database, private storage: R2Bucket) {}

  async getUserFiles(
    userId: string,
    page: number,
    limit: number,
    sort?: string,
    order?: 'asc' | 'desc',
    filter?: string,
  ): Promise<GetUserFilesResponse> {
    const offset = (page - 1) * limit;

    const query = this.db.query.files.findMany({
      where: (files, { eq, and, like }) => {
        const conditions = [eq(files.userId, userId)];
        if (filter) {
          conditions.push(like(files.fileName, `%${filter}%`));
        }
        return and(...conditions);
      },
      limit,
      offset,
      orderBy: (files, { asc, desc }) => {
        console.log('sort', sort);
        if (sort === 'name') {
          return order === 'desc' ? [desc(files.fileName)] : [asc(files.fileName)];
        }
        if (sort === 'size') {
          return order === 'desc' ? [desc(files.fileSize)] : [asc(files.fileSize)];
        }
        if (sort === 'date') {
          return order === 'desc' ? [desc(files.createdAt)] : [asc(files.createdAt)];
        }
        if (sort === 'type') {
          return order === 'desc' ? [desc(files.mimeType)] : [asc(files.mimeType)];
        }
        return [desc(files.createdAt)];
      },
    });

    const userFiles = await query;

    const totalCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(files)
      .where(eq(files.userId, userId))
      .then((result) => result[0].count);

    return {
      data: userFiles,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getFile(fileId: string): Promise<typeof files.$inferSelect | undefined> {
    return await this.db.query.files.findFirst({
      where: (files, { eq }) => eq(files.fileId, fileId),
    });
  }

  async createFile(fileData: Newfile, fileBuffer: ArrayBuffer): Promise<typeof files.$inferSelect> {
    const [file] = await this.db.insert(files).values(fileData).returning();

    await this.storage.put(`${fileData.userId}/${fileData.fileId}`, fileBuffer, {
      httpMetadata: {
        contentType: fileData.mimeType,
        contentDisposition: `inline; filename="${fileData.fileId}"`,
      },
    });

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await this.getFile(fileId);
    if (!file || file.userId !== userId) {
      return false;
    }

    await this.db.delete(files).where(eq(files.fileId, fileId));
    await this.storage.delete(`${userId}/${fileId}`);

    return true;
  }

  async updateFileName(
    fileId: string,
    userId: string,
    newFileName: string,
  ): Promise<typeof files.$inferSelect | null> {
    const file = await this.getFile(fileId);
    if (!file || file.userId !== userId) {
      return null;
    }

    const [updatedFile] = await this.db
      .update(files)
      .set({ fileName: newFileName })
      .where(eq(files.fileId, fileId))
      .returning();

    return updatedFile;
  }

  async getFileContent(userId: string, fileId: string): Promise<ArrayBuffer | null> {
    try {
      const object = await this.storage.get(`${userId}/${fileId}`);
      if (!object) {
        return null;
      }
      return await object.arrayBuffer();
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }
}
