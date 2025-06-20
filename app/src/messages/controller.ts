import { eq } from 'drizzle-orm';
import { messages, type NewMessage } from '../../db/schema';
import type { Database } from '../../db';

export class MessageController {
  constructor(private db: Database) {}

  async createMessage(messageData: NewMessage): Promise<number> {
    const result = await this.db
      .insert(messages)
      .values(messageData)
      .returning({ id: messages.id });
    return result[0].id;
  }

  async getMessageById(id: number) {
    const result = await this.db.select().from(messages).where(eq(messages.id, id));
    return result[0] || null;
  }

  async getMessagesByUserId(userId: string) {
    return await this.db.select().from(messages).where(eq(messages.userId, userId));
  }

  async getMessagesByEventId(eventId: number) {
    return await this.db.select().from(messages).where(eq(messages.eventId, eventId));
  }

  async updateMessageEventId(messageId: number, eventId: number) {
    await this.db.update(messages).set({ eventId }).where(eq(messages.id, messageId));
  }
}
