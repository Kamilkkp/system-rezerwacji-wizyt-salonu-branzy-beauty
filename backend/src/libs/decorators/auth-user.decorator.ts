import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const getAuthUserByContext = (context: ExecutionContext) =>
  context.switchToHttp().getRequest<Request>().user;

export const AuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => getAuthUserByContext(context),
);
