import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { JwtService } from './jwt.service';

//테스트할 외부 모듈의 결과를 expect 해주기 위해
import * as jwt from 'jsonwebtoken';

//외부모듈을 모킹함 신기하다
//mock테스트
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => ({ id: USER_ID })),
  };
});

const TEST_KEY = 'testKey';
const USER_ID = 2;
const TOKEN = 'TOKEN';
describe('jwtService', () => {
  let service: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: CONFIG_OPTIONS, useValue: { privateKey: TEST_KEY } },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('return signed token', () => {
      //spyOn함수 테스트
      //jest.spyOn(jwt, 'sign').mockReturnValue('TOKEN' as any);

      const token = service.sign(USER_ID);
      // console.log(token);
      // console.log(typeof token);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenLastCalledWith({ id: USER_ID }, TEST_KEY, {
        expiresIn: '60m',
      });
      expect(token).toEqual(TOKEN);

      //spyOn함수 테스트
      //   expect(jwt.sign).toHaveBeenCalledTimes(1);
      //   expect(token).toBe('TOKEN');
    });
  });

  describe('verify', () => {
    it('veryfy Token', () => {
      //spyOn함수 테스트
      //   jest.spyOn(jwt, 'verify').mockReturnValue({ id: USER_ID } as any);

      const verify = service.veryfy('TOKEN');
      // console.log(verify);
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenLastCalledWith(TOKEN, TEST_KEY);
      expect(verify).toEqual({ id: USER_ID });

      //spyOn함수 테스트
      //   expect(jwt.verify).toHaveBeenCalledTimes(1);
      //   expect(verify).toEqual({ id: 1 });
    });
  });
});
