import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { repl } from '@nestjs/core';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { number } from 'joi';
import { ErrorCode, ErrorMessageV1 } from './common/types/exception.types';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    console.log('1 - host Type', host.getType());

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (host.getType().toString() == 'graphql') {
      //컨텍스트 타입이 그래프큐엘일때는 익셉션
      //TODO TESTCASE
      // 1. CreateAccount에 catch 부분에 Custom에러 발생시키기와 그냥 throw e로 테스트해볼 수 있음
      if (exception.response && exception.response.customError) {
        //커스텀에러 발생
        console.log('1(CustomError)');

        return exception;
      } else {
        //커스텀에러가아닌 오류
        console.log('1(another)');
        //console.log(exception);
        replaceError(exception);
      }
      return exception;
    } else {
      let message = '';
      if (!exception.errorCode) {
        message = replaceError(exception);
      } else {
        message = ErrorMessageV1[exception.errorCode].message;
      }
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      response.status(500).json({
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: request.url,
        //message: exception.message || null,
        message: message || null,
      });
    }
  }
}

/**
 * @alias : 에러메세지 or 시스템 에러코드
 */
type systemCode = number | string | null | undefined;

/**
 * @alias : 커스텀에러
 * @description : 커스텀에러
 */
export class CustomError extends BadRequestException {
  constructor(errorCode: number, systemCode?: systemCode) {
    super({
      statusCode: errorCode,
      customError: 'CustomError',
      systemCode,
    });
    this.errorCode = errorCode;
  }
  errorCode: number;
}

/**
 * @alias : 에러 치환 함수
 * @description : CustomError외 정의되지 않은 Exception 발생 시 치환하기 위한 함수
 * @param error
 */
export const replaceError = (error): string => {
  let errorCode: systemCode;
  let isHttpException = false;
  if (error.driverError) {
    console.log(1);

    //TypeOrm Drive에러
    errorCode = error.driverError.code;
    console.log('driverErrorCode - ', ErrorCode[error.driverError.code]);
  } else if (error.response && error.response.statusCode) {
    console.log(2);

    //Http Error
    errorCode = error.response.statusCode;
    isHttpException = true;
  } else if (error.errorCode) {
    console.log(3);
    console.log('넌 뭐니 ?');
    errorCode = error.errorCode;
    throw new CustomError(error.errorCode);
  } else {
    console.log(error);
    errorCode = error.message;
  }

  if (!ErrorCode[errorCode]) {
    if (isHttpException) {
      return ErrorMessageV1[ErrorCode.NO_DEFINITION_ERROR].message;
    }
    //정의되지않은 오류
    throw new CustomError(ErrorCode.NO_DEFINITION_ERROR, errorCode);
  }

  if (typeof errorCode !== 'number') {
    throw new CustomError(+ErrorCode[errorCode]);
  } else {
    throw new CustomError(errorCode);
  }
};
