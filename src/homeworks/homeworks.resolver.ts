import { Query, Resolver } from '@nestjs/graphql';
import { getDataSourceName } from '@nestjs/typeorm';
import { Role } from 'src/auth/role.decorator';
import { Any } from 'typeorm';
import { SampleOutput } from './dtos/sample.dto';
import { Sample } from './eneities/sampleEntity';
import { HomeworkService } from './homeworks.service';

@Resolver(of => Sample)
@Role(['Any'])
export class HomeWorkResolver {
  constructor(private readonly homeworks: HomeworkService) {}
  @Query(returns => SampleOutput)
  fetchData() {
    console.log('hi');
    //this.homeworks.axiosFetchData();
    this.homeworks.gotFetchData();
    return { ok: true };
  }
}
