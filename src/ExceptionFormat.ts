import { GraphQLError } from 'graphql';
import { ErrorOutput as ErrorOutput } from './common/dtos/exception,dto';
import { ErrorCode, ErrorMessageV1 } from './common/types/exception.types';
import { CustomError } from './HttpExceptionFilter';

export const formmatError = (error: GraphQLError): ErrorOutput => {
  try {
    let code: any;
    let newSysCode;
    if (error.extensions && error.extensions.originalError) {
      //Custom에러인 경우 StatusCode가 있음.
      console.log('2(CustomError)');
      const { statusCode, systemCode }: any = error.extensions.originalError;
      code = statusCode;
      newSysCode = systemCode;
    } else {
      //GraphQL 자체 에러인 경우 errorCode는 문자열임
      //GraphQL 자체 에러인경우 HttpExceptionFilter를 안탐
      //playGround에서 {ok, error입력안해서 테스트가능함}
      console.log('2(graphQL)');
      newSysCode = error.message;
      code = ErrorCode[error.extensions.code as any];
    }

    return {
      message: `[${code}] - ${ErrorMessageV1[code].message}${
        newSysCode ? ` 시스템메세지(${newSysCode})` : ''
      }`,
    };
  } catch (e) {
    return error;
  }
};
