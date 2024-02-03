import { SetMetadata } from '@nestjs/common';

export const TPYEORM_CUSTOM_REPOSITORY = 'TPYEORM_CUSTOM_REPOSITORY';

// eslint-disable-next-line
export function CustomRepository(entity: Function): ClassDecorator {
  return SetMetadata(TPYEORM_CUSTOM_REPOSITORY, entity);
}
