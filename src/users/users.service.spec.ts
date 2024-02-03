import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

//오브젝트로 하면 여러 provier에 적용 시 동일한 인스턴스라고 인식하여
//함수로 만들어거 provider에서 각각의 인스턴스로 인식하도록 함
const mockRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(() => 'test'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

//spyOn 테스트용
const calculator = {
  add: (a, b) => a + b,
};
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  // let usersRepository: Repository<User>;
  beforeEach(async () => {
    const modules = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository() },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        { provide: JwtService, useValue: mockJwtService },
        //JwtService,
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();
    service = modules.get<UsersService>(UsersService);
    usersRepository = modules.get(getRepositoryToken(User));
    verificationRepository = modules.get(getRepositoryToken(Verification));
    mailService = modules.get(MailService);
    jwtService = modules.get(JwtService);

    // usersRepository = modules.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('spyOnTest', () => {
    it('spyOn 테스트', () => {
      //스파이온은 함수의 구현은 가짜로 대체하지않고 감시한다
      jest.spyOn(calculator, 'add');
      const result = calculator.add(2, 3);
      expect(result).toBe(5);
    });
  });
  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test.com',
      password: '123',
      role: UserRole.Owner,
    };
    const verificationArgs = {
      user: createAccountArgs,
      code: '',
    };
    it('유저가 이미 존재하는지 체크', async () => {
      //createAccount호출 전 mock(findOne)의 반환값을 지정해줌 즉 findOne의 리턴값을 속임
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        emmail: 'test',
        role: 'owner',
      });

      // const user: Partial<User> = { id: 1, email: 'test2' };
      // const spyGet = jest
      //   .spyOn(usersRepository, 'findOne')
      //   .mockImplementation(async () => user as User);

      // console.log(spyGet);

      const result = await service.createAccount(createAccountArgs);

      // findOne이 총 3번 호출되었는지 확인
      // spyOn은 함수의 구현을 가짜로 대체하지 않고 해당 함수의 호출 여부, 어떻게 호출되었는지 알아야할때 등 사용
      // 잘쓸지는모르겠다 ?
      //expect(spyGet).toHaveBeenCalledTimes(3);

      expect(result).toMatchObject({
        ok: false,
        error: 'there is a user with that email already',
      });
    });

    it('유저가 정상적으로 생성된 경우', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);

      verificationRepository.create.mockReturnValue(verificationArgs);
      verificationRepository.save.mockResolvedValue(verificationArgs);

      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1); //userRepository의 create가 한번 호출되었는지 체크
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs); //무슨 인수로 호출됐는지 확인
      expect(usersRepository.save).toHaveBeenCalledTimes(1); //userRepository의 create가 한번 호출되었는지 체크
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs); //무슨 인수로 호출됐는지 확인

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith(
        verificationArgs,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ ok: true });
    });

    it('Exception 발생', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('테스트 에러 발생'));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Clouldn't create Account" });
    });
  });
  describe('login', () => {
    const loginArgs = {
      email: 'test',
      password: '1234',
    };
    it('유저가 존재하지 않을때 체크', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });

    it('패스워드가 다른지 체크', async () => {
      //user Entity안의 checkPassword는 무조건 false
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: 'Wrong password' });
    });

    it('패스워드가 같으면 토큰 리턴', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'test' });
    });

    it('Exception 발생', async () => {
      usersRepository.findOne.mockRejectedValue(new Error('테스트 에러 발생'));
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: 'login error' });
    });
  });
  describe('findById', () => {
    const findUser = {
      id: 1,
    };
    it('유저를 찾았을때', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findUser);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findUser });
    });

    it('유저가 없을때 체크', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({
        error: 'User Not Found',
        ok: false,
      });
    });
  });
  describe('editProfile', () => {
    const oldUser = {
      email: 'test',
      verified: true,
    };

    const editProfileArgs = {
      userId: 1,
      email: 'test1',
    };

    const newSaveVerification = {
      code: 'code',
      user: { ...oldUser },
    };

    const newUser = {
      email: editProfileArgs.email,
      verified: false,
    };

    it('User가 없을때', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      try {
        await service.editProfile(editProfileArgs.userId, editProfileArgs);
      } catch (e) {
        expect(e.errorCode).toEqual(ErrorCode.NOT_FOUND_USER);
      }
    });

    it('Verification이 Insert했을때', async () => {
      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationRepository.findOne.mockResolvedValue(null);
      verificationRepository.create.mockReturnValue(newSaveVerification);
      verificationRepository.save.mockResolvedValue(newSaveVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });
      expect(verificationRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: editProfileArgs.userId } },
      });
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationRepository.save).toHaveBeenCalledWith(
        newSaveVerification,
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newSaveVerification.code,
      );
    });

    it('Verification이 Update했을때', async () => {
      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationRepository.findOne.mockResolvedValue(newSaveVerification);
      verificationRepository.create.mockReturnValue(newSaveVerification);
      verificationRepository.save.mockResolvedValue(newSaveVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });
      expect(verificationRepository.findOne).toHaveBeenCalledWith({
        where: { user: { id: editProfileArgs.userId } },
      });
      expect(verificationRepository.create).toHaveBeenCalledWith({
        code: newSaveVerification.code,
        user: newUser,
      });
      expect(verificationRepository.save).toHaveBeenCalledWith(
        newSaveVerification,
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newSaveVerification.code,
      );
    });

    it('패스워드 변경', async () => {
      const editProfileAtgs2 = {
        userId: 1,
        input: { password: '123' },
      };
      usersRepository.findOne.mockResolvedValue({ password: '321' });
      const result = await service.editProfile(
        editProfileAtgs2.userId,
        editProfileAtgs2.input,
      );
      expect(usersRepository.update).toHaveBeenCalledTimes(1);
      expect(usersRepository.update).toHaveBeenCalledWith(
        editProfileAtgs2.userId,
        editProfileAtgs2.input,
      );
      // expect(usersRepository.update).toHaveBeenCalledWith(
      //   editProfileAtgs2.userId,
      //   '321',
      // );
      expect(result).toEqual({ ok: true });
    });

    it('익셉션발생', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      try {
        const result = await service.editProfile(1, { email: 'test' });
        expect(result).toEqual({
          error: new Error(''),
          ok: false,
        });
      } catch (e) {
        expect(e).toEqual(new Error());
      }
    });
  });

  describe('verifyEmail', () => {
    const verification: Partial<Verification> = {
      code: 'test',
      user: { id: 1, verified: false },
      id: 1,
    };
    it('이메일 인증 완료', async () => {
      verificationRepository.findOne.mockResolvedValue(verification);
      const result = await service.verifyEmail('code');

      expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        verified: true,
        id: 1,
      });

      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith(
        verification.id,
      );

      expect(result).toEqual({ ok: true });
    });

    it('not Found', async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result.ok).toEqual(false);
      expect(result.error).toEqual(new CustomError(10000));
    });
    it('익셉션 발생', async () => {
      verificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');
      expect(result).toEqual({
        ok: false,
        error: new Error(),
      });
    });
  });
});
