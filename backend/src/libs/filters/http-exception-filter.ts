import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { redactObjectForLogging } from '@root/libs/tools/redact-object-for-logging';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter
  implements ExceptionFilter<HttpException | Error>
{
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(
    exception: HttpException | Error | PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): Response<string, Record<string, string>> {
    this.logger.error(exception.message, exception.stack);
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const requestDetails = {
      ...(request.user && { user: request.user }),
      request: {
        method: request.method,
        url: request.url,
        body:
          request.body &&
          redactObjectForLogging(request.body as Record<string, unknown>),
      },
    };

    if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025': {
          const status = HttpStatus.NOT_FOUND;
          const message = `The requested resource was not found or you don't have access.`;

          this.logger.warn(
            {
              message: `Prisma Error P2025 mapped to ${status}: ${message}`,
              ...requestDetails,
              prismaMeta: exception.meta,
            },
            exception.stack,
          );

          return response.status(status).json({
            statusCode: status,
            message: message,
            error: 'Not Found',
          });
        }
        case 'P2003': {
          const status = HttpStatus.NOT_FOUND;
          const message = `A related resource could not be found or you don't have access`;

          this.logger.warn(
            {
              message: `Prisma Error P2003 mapped to ${status}: ${message}`,
              ...requestDetails,
              prismaMeta: exception.meta,
            },
            exception.stack,
          );

          return response.status(status).json({
            statusCode: status,
            message: message,
            error: 'Not Found',
          });
        }
      }
    }

    if (exception instanceof HttpException) {
      this.logger.error(
        {
          ...(request.user && {
            user: request.user,
          }),
          request: {
            method: request.method,
            url: request.url,
            body:
              request.body &&
              redactObjectForLogging(request.body as Record<string, unknown>),
          },
          message: exception.getResponse(),
        },
        exception.stack,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (exception.getStatus() === HttpStatus.INTERNAL_SERVER_ERROR)
        return response.status(500).json();
      if (
        exception.getStatus() === 404 &&
        exception.message.split(' ')[0] === 'Cannot' &&
        exception.message.split(' ').length === 3
      )
        return response.status(404).json();
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    this.logger.error(
      {
        ...(request.user && {
          user: request.user,
        }),
        request: {
          method: request.method,
          url: request.url,
          body:
            request.body &&
            redactObjectForLogging(request.body as Record<string, unknown>),
        },
        message: exception.message,
      },
      exception.stack,
    );
    return response.status(500).json();
  }
}
