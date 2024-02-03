/* /src/auth/role.decorator.ts */
/* 유저 롤을 구분하기 위해 사용하며 롤은 Client, Owner, Delivery 밑에 추가되는 Any 총 4개이다 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type AllowedRoles = keyof typeof UserRole | 'Any';
export const Role = (roles: AllowedRoles[]) => SetMetadata('roles', roles);
