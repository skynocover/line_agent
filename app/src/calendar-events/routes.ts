import { Hono } from 'hono';
import type { Bindings } from '../index';
import { CalendarEventController } from './controller';

const calendarEvents = new Hono<{ Bindings: Bindings }>();

// Get user's calendar events with pagination and filtering
calendarEvents.get('/:userId/events', async (c) => {
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const sort = c.req.query('sort');
  const order = c.req.query('order') as 'asc' | 'desc' | undefined;
  const filter = c.req.query('filter');
  const startTime = c.req.query('startTime');
  const endTime = c.req.query('endTime');

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new CalendarEventController(db);

  try {
    const response = await controller.getUserEvents(
      userId,
      page,
      limit,
      sort,
      order,
      filter,
      startTime,
      endTime,
    );
    return c.json(response);
  } catch (error) {
    console.error('Error fetching user events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// Create a new calendar event
calendarEvents.post('/:userId/events', async (c) => {
  const userId = c.req.param('userId');
  const eventData = await c.req.json();

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new CalendarEventController(db);

  try {
    const newEvent = await controller.createEvent({ ...eventData, userId });
    return c.json(newEvent, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// Update a calendar event
calendarEvents.patch('/:userId/events/:eventId', async (c) => {
  const eventId = parseInt(c.req.param('eventId'));
  const userId = c.req.param('userId');
  const eventData = await c.req.json();

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new CalendarEventController(db);

  try {
    const updatedEvent = await controller.updateEvent(eventId, userId, eventData);
    if (!updatedEvent) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }
    return c.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// Delete a calendar event
calendarEvents.delete('/:userId/events/:eventId', async (c) => {
  const eventId = parseInt(c.req.param('eventId'));
  const userId = c.req.param('userId');

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new CalendarEventController(db);

  try {
    const success = await controller.deleteEvent(eventId, userId);
    if (!success) {
      return c.json({ error: 'Event not found or unauthorized' }, 404);
    }
    return c.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

export default calendarEvents;
