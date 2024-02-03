import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    console.log('4 - call AuthDecorator');
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user = gqlContext.user;
    return user;
  },
);
