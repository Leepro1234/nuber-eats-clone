import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';
import got from 'got';
import * as FormData from 'form-data';
import { EmailVars } from './mail.interfaces';

class TestMailService extends MailService {
  //상속받아와 부모클래스의 함수를 호출하도록 구현
  public sendEmail(
    subject: string,
    template: string,
    to: string,
    emailVars: EmailVars[],
  ) {
    return super.sendEmail(subject, template, to, emailVars);
  }
}
jest.mock('got');
jest.mock('form-data');

const apiKey = 'TEST';
const domain = 'TestDomain';
const fromEmail = 'TestEmail';
const sendVerificationEmailArgs = {
  email: 'email',
  code: 'code',
};
describe('mailService', () => {
  let service: TestMailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TestMailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { apiKey: apiKey, domain: domain, fromEmail: fromEmail },
        },
      ],
    }).compile();
    service = module.get<TestMailService>(TestMailService);
  });
  it('is Defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('isSendVerificationEmail', () => {
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'sample',
        sendVerificationEmailArgs.email,
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });

  describe('sendEmail', () => {
    it('send emails', async () => {
      const ok = await service.sendEmail('', '', '', [
        { key: 'one', value: '1' },
      ]);

      //console.log('FormDatas', FormData);
      //console.log('prototypes', FormData.prototype);
      // const t = [];

      const formSpy = jest.spyOn(FormData.prototype, 'append');
      // .mockImplementation((a, v) => {
      //   console.log('a?', a, ' v?', v);
      //   // 실제로 append 메소드를 호출한 횟수를 기록합니다.
      //   t.push([a, v]);
      // });
      // console.log('t calls:', t);

      expect(formSpy).toHaveBeenCalledTimes(5);

      //mock된 got의 post메서드
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${domain}/messages`,
        expect.any(Object),
      );
      expect(ok).toEqual(true);
    });
  });

  it('fails on error', async () => {
    //got의 post 결과를 mock함
    jest.spyOn(got, 'post').mockImplementation(() => {
      throw new Error();
    });

    const ok = await service.sendEmail('', '', '', [
      { key: 'one', value: '12222' },
    ]);
    expect(ok).toEqual(false);
  });
});
