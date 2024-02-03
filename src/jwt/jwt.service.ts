import { Inject, Injectable } from '@nestjs/common';
import { JwtModuleOptions } from './jwt.interfaces';
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {
    //console.log(options);
  }
  sign(userId: number): string {
    //spy테스트를위해 콜수
    //jwt.sign({ id: userId }, this.options.privateKey);
    return jwt.sign({ id: userId }, this.options.privateKey, {
      expiresIn: '60m',
    });
  }
  veryfy(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}
