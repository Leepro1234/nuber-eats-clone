export interface QueryOptions {
  where?: Record<string, any>;
  take?: number;
  skip?: number;
  // 다른 필요한 쿼리 옵션들을 추가할 수 있음
}
