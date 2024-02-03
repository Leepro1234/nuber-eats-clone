import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account..dto';
import { LoginInput, LoginIOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';
import { CustomError } from 'src/HttpExceptionFilter';
import { ErrorCode } from 'src/common/types/exception.types';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    // check new user
    // create user & hash the password
    try {
      //typeORM 버전이 올라가면서 findOne 사용시 where를 명시하도록 바뀜
      const exists = await this.users.findOne({ where: { email } });

      //console.log('유닛테스팅', exists); //유닛테스팅 테스트용.

      if (exists) {
        //duplicate error
        return { ok: false, error: 'there is a user with that email already' };
      }
      //create가 instance를 생성함 (Instance를 생성해야지만 Listner가 동작함)
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verification.save(
        this.verification.create({
          user,
        }),
      );
      //await this.users.save({ email, password, role });

      this.mailService.sendVerificationEmail(user.email, verification.code);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: "Clouldn't create Account" };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginIOutput> {
    //find the user with the email
    // check if the password is correct
    // make a JWT and give it to the user
    try {
      const user = await this.users.findOne({
        where: { email: email },
        select: ['id', 'password'], //Entity에 기본 Selct를 False로 하였기때문에, Select를 해온다고 명시함.
      });
      if (!user) {
        return { ok: false, error: 'User Not Found' };
      }
      const passwrodCorrect = await user.checkPassword(password);

      if (!passwrodCorrect) {
        return { ok: false, error: 'Wrong password' };
      }

      //const token = jwt.sign({ id: user.id }, this.config.get('PRIVATE_KEY'));
      const token = this.jwtService.sign(user.id);
      return {
        ok: passwrodCorrect,
        token: token,
      };
    } catch (error) {
      return { ok: false, error: 'login error' };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    let verification2;

    try {
      const user = await this.users.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new CustomError(ErrorCode.NOT_FOUND_USER);
      }
      if (email) {
        user.email = email;
        user.verified = false;

        //verification 객체 가져오기
        const verification = await this.verification.findOne({
          where: { user: { id: userId } },
        });

        if (!verification) {
          verification2 = await this.verification.save(
            this.verification.create({ user }),
          );
        } else {
          verification.user = user;
          verification.code = ''; //새로생성하기위해 초기화
          verification2 = await this.verification.save(
            this.verification.create(verification),
          );

          // const verification2 = await this.verification.save(
          //   this.verification.create({ user }),
          // );
        }
        this.mailService.sendVerificationEmail(user.email, verification2.code);
      }
      user.password = password ?? user.password;
      //return await this.users.save(user);
      await this.users.update(userId, user);
      return { ok: true };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verification.findOne({
        where: { code: code },
        //loadRelationIds: true, //참조된 테이블에서 verification에 있는 컬럼만
        relations: ['user'], //참조된 테이블의 모든 컬럼
      });

      if (!verification) {
        throw new CustomError(ErrorCode.UNAUTHORIZED);
      }
      //특정 컬럼들만 추출하고싶은경우 쿼리처럼 사용
      // const verification2 = await this.verification
      //   .createQueryBuilder('verification')
      //   .leftJoinAndSelect('verification.user', 'user')
      //   .where('verification.code = :code', { code })
      //   .select(['verification.code', 'user.id', 'user.email'])
      //   .getOne();

      // console.log(verification2);

      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        this.verification.delete(verification.id);
        return {
          ok: true,
        };
      }
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ where: { id: id } });
      if (user) {
        return { ok: true, user: user };
      }
    } catch (error) {
      return {
        ok: false,
        error: 'User Not Found',
      };
    }
  }
}
