import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = err;

  // OpenAI API 에러 처리
  if (err.message.includes('OpenAI')) {
    statusCode = 503;
    message = 'AI 서비스 일시적 장애가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }

  // Redis 에러 처리
  if (err.message.includes('Redis')) {
    statusCode = 503;
    message = '캐시 서비스에 문제가 발생했습니다.';
  }

  // 이미지 처리 에러
  if (err.message.includes('Sharp') || err.message.includes('image')) {
    statusCode = 422;
    message = '이미지 처리 중 오류가 발생했습니다.';
  }

  // 로깅 (프로덕션에서는 적절한 로깅 서비스 사용)
  console.error(`[${new Date().toISOString()}] Error:`, {
    statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? message : err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};
