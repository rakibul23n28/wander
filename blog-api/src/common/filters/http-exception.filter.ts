import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

function getMessage(payload: unknown): string | string[] {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.message)) return record.message as string[];
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  return 'Unexpected error';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: Record<string, unknown> = {
      statusCode: status,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      const message = getMessage(responseBody);
      payload = {
        statusCode: status,
        error: HttpStatus[status] ?? 'Http Exception',
        message,
      };
      if (Array.isArray(message) && message.length) {
        payload.details = message;
      }
    } else if (typeof exception === 'object' && exception !== null && 'code' in exception) {
      const errorCode = String((exception as any).code);
      if (errorCode === 'P2002') {
        status = HttpStatus.CONFLICT;
        payload = { statusCode: status, error: 'Conflict', message: 'A record with this value already exists.' };
      } else if (errorCode === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        payload = { statusCode: status, error: 'Not Found', message: 'Record not found.' };
      } else {
        payload = { statusCode: status, error: 'Prisma Error', message: 'A database error occurred.' };
      }
    }

    response.status(status).json(payload);
  }
}
