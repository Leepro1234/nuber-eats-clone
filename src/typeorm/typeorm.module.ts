import { DynamicModule, Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TPYEORM_CUSTOM_REPOSITORY } from './custom.repository.decorator';
/**
 *  @CustomRepository 데코레이터를 사용할경우
 *  CustomRepository에 담겨있는 메타데이터들을 가져온다. 그 후 DataSource 정보를 주입받고
 *  providers 에 추가한다.
 *  해당 모듈을 통해 우리가 만든 데코레이터로 CustomRepository 기능을 사용할 수 있게 된다.
 */
export class TypeOrmCustomModule {
  public static forCustomRepository<T extends new (...args: any[]) => any>(
    repositories: T[],
  ): DynamicModule {
    const providers: Provider[] = [];

    // console.log('repositories', repositories);
    for (const repository of repositories) {
      //decorator 선언시 입력한 entity임
      const entity = Reflect.getMetadata(TPYEORM_CUSTOM_REPOSITORY, repository);
      // console.log('entity', entity);

      if (!entity) {
        continue;
      }

      providers.push({
        inject: [getDataSourceToken()],
        provide: repository,
        useFactory: (dataSource: DataSource): typeof repository => {
          const baseRepository = dataSource.getRepository<any>(entity);
          return new repository(
            baseRepository.target,
            baseRepository.manager,
            baseRepository.queryRunner,
          );
        },
      });
    }

    return {
      exports: providers,
      module: TypeOrmCustomModule,
      providers,
    };
  }
}
