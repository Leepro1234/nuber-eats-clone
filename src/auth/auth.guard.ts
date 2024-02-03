//request를 진행할지 말지 결정

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

//미들웨어 > 가드 > route
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    console.log('3, call authGuard');
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    if (!roles) {
      //모두 접근이 가능한 페이지
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    if (!token) {
      throw new CustomError(ErrorCode.UNAUTHORIZED);
    }
    try {
      const decode = this.jwtService.veryfy(token.toString());
      if (typeof decode === 'object' && decode.hasOwnProperty('id')) {
        const result = await this.userService.findById(decode['id']);

        const user: User = result.user;
        if (!user) {
          throw new CustomError(ErrorCode.UNAUTHORIZED);
        }

        gqlContext['user'] = user;

        if (roles.includes('Any')) {
          //모두 접근이 가능한페이지
          return true;
        }
        if (!roles.includes(user.role)) {
          //권한이 없으면 에러처리
          throw new CustomError(ErrorCode.GRAPHQL_FORBIDDEN);
        }

        //접근이 가능한경우 true 아닌경우 false로 인해 forbidden에러 발생
        return roles.includes(user.role);
      } else {
        throw new CustomError(ErrorCode.UNAUTHORIZED);
      }
    } catch (e) {
      if (e.message === 'jwt expired') {
        throw new CustomError(ErrorCode.AUTH_EXPIRES);
      }
    }
  }
}
