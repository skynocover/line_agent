import { Hono } from 'hono';
import type { Bindings } from '../index';
import { FileController } from './controller';

const files = new Hono<{ Bindings: Bindings }>();

files.get('/:userId/files', async (c) => {
  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const sort = c.req.query('sort');
  const order = c.req.query('order') as 'asc' | 'desc' | undefined;
  const filter = c.req.query('filter');

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new FileController(db, c.env.APP_STORAGE);

  try {
    const response = await controller.getUserFiles(userId, page, limit, sort, order, filter);
    return c.json(response);
  } catch (error) {
    console.error('Error fetching user files:', error);
    return c.json({ error: 'Failed to fetch files' }, 500);
  }
});

files.get('/:userId/files/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const userId = c.req.param('userId');

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new FileController(db, c.env.APP_STORAGE);

  try {
    const file = await controller.getFile(fileId);
    if (!file || file.userId !== userId) {
      return c.json({ error: 'File not found' }, 404);
    }
    return c.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    return c.json({ error: 'Failed to fetch file' }, 500);
  }
});

files.delete('/:userId/files/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const userId = c.req.param('userId');

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new FileController(db, c.env.APP_STORAGE);

  try {
    const success = await controller.deleteFile(fileId, userId);
    if (!success) {
      return c.json({ error: 'File not found or unauthorized' }, 404);
    }
    return c.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return c.json({ error: 'Failed to delete file' }, 500);
  }
});

files.patch('/:userId/files/:fileId', async (c) => {
  const fileId = c.req.param('fileId');
  const userId = c.req.param('userId');
  const { fileName } = await c.req.json();

  if (!fileName) {
    return c.json({ error: 'New file name is required' }, 400);
  }

  // @ts-ignore
  const db = c.get('db') as Database;
  const controller = new FileController(db, c.env.APP_STORAGE);

  try {
    const updatedFile = await controller.updateFileName(fileId, userId, fileName);
    if (!updatedFile) {
      return c.json({ error: 'File not found or unauthorized' }, 404);
    }
    return c.json(updatedFile);
  } catch (error) {
    console.error('Error updating file:', error);
    return c.json({ error: 'Failed to update file' }, 500);
  }
});

export default files;
