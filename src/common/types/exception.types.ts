export enum ErrorCode {
  /**
   * @alias 연결안됨
   * @description 이거는 이러이러해서 이 에러다
   */
  UNAUTHORIZED = 10000,

  AUTH_EXPIRES = 10001,
  FORBIDDEN = 403,
  /* DBError */
  /* Status (400) + DB(2) + DBErrorCode */
  ER_DUP_ENTRY = 40021062,

  /* GraphQL Error */
  /* Status (400) + GraphQL(3) + DBErrorCode */
  GRAPHQL_VALIDATION_FAILED = 40010001,

  /**
   * @alias GRAPHQL_FORBIDDEN
   * @description 권한없음
   */
  GRAPHQL_FORBIDDEN = 40310001,

  /* CustomError */

  /**
   * @alias NOT_FOUND_RESTAURANT
   * @description 레스토랑을 찾지못함
   */
  NOT_FOUND_RESTAURANT = 4001001 /* Status (4) + Restaurant(001) + ErrorCode(001) */,
  NOT_LOAD_CATEGORIES = 4001002 /* Status (4) + Restaurant(001)  + ErrorCode(002) */,
  NOT_LOAD_RESTAURANTS = 4001003 /* Status (4) + Restaurant(001)  + ErrorCode(003) */,

  NOT_FOUND_USER = 4002001 /* Status (4) + User(002)  + ErrorCode(001) */,

  /**
   * @alias DISH_NOT_FOUND
   * @description Dish 정보를 찾지못함
   */
  NOT_FOUND_DISH = 4003001 /* Status (4) + Dish(003) + ErrorCode(001) */,

  NOT_MATCH_OWNER = 4000001 /* Status (4) + 공통(000) + ErrorCode(001) */,

  NO_DEFINITION_ERROR = 4000999 /* Status (4) + 공통(000) + ErrorCode(999) */,
}

export const ErrorMessageV1 = {
  [ErrorCode.UNAUTHORIZED]: {
    // code: 10000,
    message: '인증정보가 잘못되었습니다.',
  },
  [ErrorCode.AUTH_EXPIRES]: {
    // code: 10001,
    message: 'JWT 인증토큰이 만료되었습니다.',
  },

  [ErrorCode.FORBIDDEN]: {
    // code: 10001,
    message: '권한이 없습니다.',
  },

  /* DB ERROR */
  [ErrorCode.ER_DUP_ENTRY]: {
    // code: 40021062,
    message: '현재 사용중인이메일입니다.',
  },
  /* GraphQL Error */
  [ErrorCode.GRAPHQL_VALIDATION_FAILED]: {
    // code: 40010001,
    message: 'GraphQL 쿼리가 잘못되었습니다.',
  },
  [ErrorCode.GRAPHQL_FORBIDDEN]: {
    // code: 40310001,
    message: '권한이 없습니다.',
  },

  /* CustomError */

  [ErrorCode.NOT_FOUND_RESTAURANT]: {
    message: '레스토랑정보를 찾을 수 없습니다.',
  },
  [ErrorCode.NOT_MATCH_OWNER]: {
    message: '일치하는 사업자 정보가 없습니다.',
  },
  [ErrorCode.NOT_LOAD_CATEGORIES]: {
    message: '카테고리 정보를 불러오지 못하였습니다.',
  },
  [ErrorCode.NOT_LOAD_RESTAURANTS]: {
    message: '레스토랑 정보를 불러오지 못하였습니다.',
  },

  [ErrorCode.NOT_FOUND_USER]: {
    message: '사용자를 찾을 수 없습니다.',
  },

  [ErrorCode.NO_DEFINITION_ERROR]: {
    message: '알수 없는 에러가 발생하였습니다.',
  },

  [ErrorCode.NOT_FOUND_DISH]: {
    message: 'DISH정보를 찾지 못하였습니다.',
  },
};
