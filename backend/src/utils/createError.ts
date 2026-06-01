import { AppError } from '../middleware/errorHandler';

export const createError = (
  message: string,
  statusCode = 500,
  isOperational = true
): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = isOperational;
  return err;
};
