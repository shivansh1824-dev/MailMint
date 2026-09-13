import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const isProd = ENV.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
}
