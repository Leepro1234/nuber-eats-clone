import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { UsersService } from 'src/users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log(1);
    if ('x-jwt' in req.headers) {
      const token = req.headers['x-jwt'];
      try {
        req['token'] = token;
      } catch (e) {
        if (e.message === 'jwt expired') {
          throw new CustomError(ErrorCode.AUTH_EXPIRES);
        }
      }
    }
    next();
  }
}
export function jwtMiddlewareFunction(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log('not working');
  next();
}
