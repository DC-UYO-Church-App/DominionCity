import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

export const errorHandler = (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  console.error('Error:', error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({
      error: 'Invalid token',
      message: error.message,
    });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({
      error: 'Token expired',
      message: 'Please login again',
    });
  }

  // Schema/validation errors (Fastify sets `validation`; custom ones use the name)
  if (error.validation || error.name === 'ValidationError') {
    return reply.status(400).send({
      error: 'Validation error',
      message: error.message,
    });
  }

  // Database errors
  if (error.message.includes('duplicate key')) {
    return reply.status(409).send({
      error: 'Duplicate entry',
      message: 'Resource already exists',
    });
  }

  // Honour the status code Fastify (or the thrower) attached, so genuine
  // client errors (400/401/403/404, empty body, unsupported media type, etc.)
  // aren't masked as 500s.
  const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
  if (statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({
      error: error.message || 'Request error',
      message: error.message,
    });
  }

  // Default error (unexpected server-side failures)
  return reply.status(statusCode >= 500 ? statusCode : 500).send({
    error: 'Internal server error',
    message: error.message,
  });
};
