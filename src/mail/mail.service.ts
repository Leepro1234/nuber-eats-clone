import { Inject } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVars, MailModuleOptions } from './mail.interfaces';
import got from 'got';
import * as FormData from 'form-data';
import { getLocation } from 'graphql';
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  protected async sendEmail(
    subject: string,
    template: string,
    to: string,
    emailVars: EmailVars[],
  ): Promise<boolean> {
    const form = new FormData();
    form.append(
      'from',
      `Maverick from Nuber Eats <mailgun@${this.options.domain}>`,
    );
    form.append('to', `${to}`);
    form.append('template', `${template}`);
    form.append('subject', `${subject}`);
    emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
    try {
      const a = await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );

      console.log(a);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'sample', email, [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
