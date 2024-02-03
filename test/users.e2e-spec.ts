import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import got from 'got';

const GRAPHQL_ENDPOINT = '/graphql';
const EMAIL = 'pizza030667@gmail.com';
const PASSWORD = '1234';

//안먹는소스
// jest.mock('got', () => {
//   return {
//     post: jest.fn(),
//   };
// });
describe('userModule (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let usersRepository: Repository<User>;
  let verifycationRepository: Repository<Verification>;
  let connection: DataSource;
  const dataSource: DataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', token).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verifycationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    connection = await dataSource.initialize();
    //Drop the Database
    await connection.dropDatabase(); // 데이터베이스 삭제
    await connection.destroy(); // 연결 해제
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', async () => {
      jest
        .spyOn(got, 'post')
        .mockResolvedValue({ response: { data: { ok: true } } });
      return publicTest(`
      mutation{
        createAccount(input:
          {
            email:"${EMAIL}",
            password:"${PASSWORD}",
            role:Client
          })
          {
          ok,
          error
          }
      }
      `)
        .expect(200)
        .expect(res => {
          console.log(res.body);
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    // it('should create account', () => {
    //   return request(app.getHttpServer())
    //     .post(GRAPHQL_ENDPOINT)
    //     .send({
    //       query: `
    //       mutation{
    //         createAccount(input:
    //           {
    //             email:"pizza0306682@gmail.com",
    //             password:"${PASSWORD}",
    //             role:Client
    //           })
    //           {
    //           ok,
    //           error
    //           }
    //       }
    //       `,
    //     })
    //     .expect(200)
    //     .expect(res => {
    //       console.log(res.body);
    //       expect(res.body.data.createAccount.ok).toBe(true);
    //       expect(res.body.data.createAccount.error).toBe(null);
    //     });
    // });

    it('계정이 이미존재한다면,', async () => {
      return publicTest(`
      mutation{
        createAccount(input:
          {
            email:"${EMAIL}",
            password:"${PASSWORD}",
            role:Client
          })
          {
          ok,
          error
          }
      }
      `)
        .expect(200)
        .expect(res => {
          console.log(res.body);
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toEqual(expect.any(String));
        });
    });
  });

  describe('login', () => {
    it('로그인 성공', () => {
      return publicTest(`
        mutation{
          login(input:{
            email:"${EMAIL}",
            password:"${PASSWORD}"
          })
          {
            ok,
            error,token
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          console.log(login);
          console.log(res.body.data.login.ok);
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          token = login.token;
        });
    });

    it('로그인 실패', () => {
      return publicTest(`
          mutation{
            login(input:{
              email:"${EMAIL}",
              password:"123123"
            })
            {
              ok,
              error,token
            }
          }
          `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          console.log(login);
          console.log(res.body.data.login.ok);
          expect(login.ok).toBe(false);
          expect(login.error).toBe('Wrong password');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      //찾은 유저중 첫 유저의 아이디를 가져옴
      const [user] = await usersRepository.find();
      userId = user.id;
      console.log(user);
    });
    it('유저가 있으면', () => {
      return privateTest(`
        {
          userProfile(userId:${userId}){
            ok
            error
            user{
              id
            }
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          console.log('userProfile', id);

          expect(id).toBe(userId);
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('유저가 없으면', () => {
      return privateTest(`
        {
          userProfile(userId:12312){
            ok
            error
            user{
              id
            }
          }
        }
        `)
        .expect(200)
        .expect(res => {
          console.log(res.body);

          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;

          expect(user).toBe(null);
          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
        });
    });

    it('잘못된 토큰', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', '12312312123')
        .send({
          query: `
        {
          userProfile(userId:12312){
            ok
            error
            user{
              id
            }
          }
        }
        `,
        })
        .expect(200)
        .expect(res => {
          const {
            errors: [{ message }],
          } = res.body;
          expect(message).toContain('[10000] - 인증정보가 잘못되었습니다.');
        });
    });
  });

  describe('me', () => {
    it('로그인 되었을때', async () => {
      return await privateTest(`
        {
          me {
            email
          }
        }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(EMAIL);
        });
    });

    it('로그인 실패되었을때', async () => {
      //일부러 인증 키없이 보내기
      return await publicTest(`
        {
          me {
            email
          }
        }
        `)
        .expect(200)
        .expect(res => {
          console.log(res.body);

          const {
            errors: [{ message }],
          } = res.body;
          expect(message).toContain('[10000] - 인증정보가 잘못되었습니다.');
        });
    });
  });

  describe('editProfile', () => {
    it('이메일변경', async () => {
      return await privateTest(` 
          mutation {
            editProfile (input:{
              email:"pizza030668@gmail.com"
            })
            {
              ok
              error
            }
          }`)
        .expect(200)
        .expect(res => {
          const {
            data: {
              editProfile: { ok, error },
            },
          } = res.body;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        })
        .then(async () => {
          await privateTest(`
        {
          me {
            email
          }
        }
        `)
            .expect(200)
            .expect(res => {
              const {
                data: {
                  me: { email },
                },
              } = res.body;
              expect(email).toBe('pizza030668@gmail.com');
            });
        });
    });
  });

  describe('VerifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verifycationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify emal', async () => {
      return publicTest(`
        mutation{
          VerifyEmail(input:{
            code:"${verificationCode}"
          })
          {
            ok
            error
          }
        }`)
        .expect(200)
        .expect(res => {
          const {
            data: {
              VerifyEmail: { ok },
            },
          } = res.body;
          expect(ok).toBe(true);
        });
    });

    it('should fail on wrong verification code', async () => {
      return publicTest(`
      mutation{
        VerifyEmail(input:{
          code:"xxxxx"
        })
        {
          ok
          error
        }
      }`)
        .expect(200)
        .expect(res => {
          const {
            errors: [{ message }],
          } = res.body;
          expect(message).toBe(`[10000] - 인증정보가 잘못되었습니다.`);
        });
    });
  });
});
