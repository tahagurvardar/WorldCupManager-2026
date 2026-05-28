import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { config } from '../config/env.js';

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let details = error.details || null;

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Validation failed';
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error instanceof ZodError) {
    statusCode = 422;
    message = 'Request validation failed';
    details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate resource';
    details = error.keyValue;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
  });
}
