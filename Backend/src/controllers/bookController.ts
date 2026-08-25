import { FastifyReply, FastifyRequest } from 'fastify';
import { BookService } from '../services/bookService';
import { AuthenticatedRequest } from '../middleware/auth';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { buildStoredFilename } from '../utils/multipart';

export class BookController {
  static async createBook(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const isMultipart = (request as any).isMultipart?.() ?? false;
      let fields: Record<string, any> = {};
      let coverImage: string | undefined;
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (isMultipart) {
        const parts = (request as any).parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (!part.mimetype || !allowedImageTypes.includes(part.mimetype)) {
              return reply.status(400).send({ error: 'Only JPG or PNG images are allowed' });
            }
            if (part.fieldname !== 'cover') {
              continue;
            }
            await fs.mkdir(config.upload.dir, { recursive: true });
            const filename = buildStoredFilename(request.user!.id, part.filename, part.mimetype);
            const filePath = path.join(config.upload.dir, filename);
            const buffer = await part.toBuffer();
            await fs.writeFile(filePath, buffer);
            coverImage = `/uploads/${filename}`;
          } else {
            fields[part.fieldname] = part.value;
          }
        }
      } else {
        fields = request.body as any;
      }

      const { title, author, category, price, quantity, summary } = fields;

      if (!title || !author || !category) {
        return reply.status(400).send({ error: 'Title, author, and category are required' });
      }

      const parsedPrice = Number(price ?? 0);
      const parsedQuantity = Number(quantity ?? 0);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return reply.status(400).send({ error: 'Invalid price value' });
      }
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
        return reply.status(400).send({ error: 'Invalid quantity value' });
      }

      const book = await BookService.createBook({
        title,
        author,
        category,
        price: parsedPrice,
        quantity: parsedQuantity,
        summary,
        coverImage,
        createdBy: request.user!.id,
      });

      reply.status(201).send({ book });
    } catch (error) {
      console.error('Create book error:', error);
      reply.status(500).send({ error: 'Failed to create book' });
    }
  }

  static async getAllBooks(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const books = await BookService.getAllBooks();
      reply.send({ books });
    } catch (error) {
      console.error('Get books error:', error);
      reply.status(500).send({ error: 'Failed to load books' });
    }
  }

  static async getBookStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await BookService.getBookStats();
      reply.send(stats);
    } catch (error) {
      console.error('Get book stats error:', error);
      reply.status(500).send({ error: 'Failed to load book stats' });
    }
  }

  static async getBookSales(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const sales = await BookService.getBookSales();
      reply.send({ sales });
    } catch (error) {
      console.error('Get book sales error:', error);
      reply.status(500).send({ error: 'Failed to load book sales' });
    }
  }

  static async updateBook(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const isMultipart = (request as any).isMultipart?.() ?? false;
      let updates: Record<string, any> = {};
      let coverImage: string | undefined;
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (isMultipart) {
        const parts = (request as any).parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (!part.mimetype || !allowedImageTypes.includes(part.mimetype)) {
              return reply.status(400).send({ error: 'Only JPG or PNG images are allowed' });
            }
            if (part.fieldname !== 'cover') {
              continue;
            }
            await fs.mkdir(config.upload.dir, { recursive: true });
            const filename = buildStoredFilename(request.user!.id, part.filename, part.mimetype);
            const filePath = path.join(config.upload.dir, filename);
            const buffer = await part.toBuffer();
            await fs.writeFile(filePath, buffer);
            coverImage = `/uploads/${filename}`;
          } else {
            updates[part.fieldname] = part.value;
          }
        }
      } else {
        updates = request.body as any;
      }

      if (updates.price !== undefined) {
        const parsedPrice = Number(updates.price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return reply.status(400).send({ error: 'Invalid price value' });
        }
        updates.price = parsedPrice;
      }

      if (updates.quantity !== undefined) {
        const parsedQuantity = Number(updates.quantity);
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
          return reply.status(400).send({ error: 'Invalid quantity value' });
        }
        updates.quantity = parsedQuantity;
      }

      if (coverImage) {
        updates.coverImage = coverImage;
      }

      const book = await BookService.updateBook(id, updates);
      if (!book) {
        return reply.status(404).send({ error: 'Book not found' });
      }

      reply.send({ book });
    } catch (error) {
      console.error('Update book error:', error);
      reply.status(500).send({ error: 'Failed to update book' });
    }
  }

  static async deleteBook(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const success = await BookService.deleteBook(id);
      if (!success) {
        return reply.status(404).send({ error: 'Book not found' });
      }
      reply.send({ message: 'Book deleted' });
    } catch (error) {
      console.error('Delete book error:', error);
      reply.status(500).send({ error: 'Failed to delete book' });
    }
  }
}
