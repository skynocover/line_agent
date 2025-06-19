import { Context } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../db';
import { calendarEvents } from '../../db/schema';
import type { NewCalendarEvent } from '../../db/schema';

export class CalendarEventController {
  constructor(private db: Database) {}

  async getUserEvents(
    userId: string,
    page: number,
    limit: number,
    sort?: string,
    order?: 'asc' | 'desc',
    filter?: string,
    startTime?: string,
    endTime?: string,
  ) {
    const offset = (page - 1) * limit;

    const query = this.db.query.calendarEvents.findMany({
      where: (events, { eq, and, like, gte, lte }) => {
        const conditions = [eq(events.userId, userId)];

        if (filter) {
          conditions.push(like(events.title, `%${filter}%`));
        }

        if (startTime) {
          conditions.push(gte(events.start, new Date(startTime)));
        }

        if (endTime) {
          conditions.push(lte(events.end, new Date(endTime)));
        }

        return and(...conditions);
      },
      limit,
      offset,
      orderBy: (events, { asc, desc }) => {
        if (sort === 'title') {
          return order === 'desc' ? [desc(events.title)] : [asc(events.title)];
        }
        if (sort === 'start') {
          return order === 'desc' ? [desc(events.start)] : [asc(events.start)];
        }
        if (sort === 'end') {
          return order === 'desc' ? [desc(events.end)] : [asc(events.end)];
        }
        return [desc(events.createdAt)];
      },
    });

    const userEvents = await query;

    const totalCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId))
      .then((result) => result[0].count);

    return {
      data: userEvents,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getEvent(eventId: number): Promise<typeof calendarEvents.$inferSelect | undefined> {
    return await this.db.query.calendarEvents.findFirst({
      where: (events, { eq }) => eq(events.id, eventId),
    });
  }

  async createEvent(eventData: NewCalendarEvent): Promise<typeof calendarEvents.$inferSelect> {
    const [event] = await this.db
      .insert(calendarEvents)
      .values({
        ...eventData,
        start: new Date(eventData.start || ''),
        end: new Date(eventData.end || ''),
      })
      .returning();
    return event;
  }

  async updateEvent(
    eventId: number,
    userId: string,
    eventData: Partial<NewCalendarEvent>,
  ): Promise<typeof calendarEvents.$inferSelect | null> {
    const event = await this.getEvent(eventId);
    if (!event || event.userId !== userId) {
      return null;
    }

    const [updatedEvent] = await this.db
      .update(calendarEvents)
      .set({
        ...eventData,
        start: new Date(eventData.start || ''),
        end: new Date(eventData.end || ''),
        createdAt: undefined,
      })
      .where(eq(calendarEvents.id, eventId))
      .returning();

    return updatedEvent;
  }

  async deleteEvent(eventId: number, userId: string): Promise<boolean> {
    const event = await this.getEvent(eventId);
    if (!event || event.userId !== userId) {
      return false;
    }

    await this.db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));
    return true;
  }

  async getIncompleteExpiredEvents(
    userId: string,
  ): Promise<(typeof calendarEvents.$inferSelect)[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 設定為今天凌晨

    return await this.db.query.calendarEvents.findMany({
      where: (events, { eq, and, lt }) =>
        and(eq(events.userId, userId), eq(events.completed, false), lt(events.end, today)),
      orderBy: (events, { asc }) => [asc(events.end)],
    });
  }
}
