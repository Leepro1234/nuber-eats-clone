import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeWorkResolver } from './homeworks.resolver';
import { HomeworkService } from './homeworks.service';
@Module({
  imports: [],
  providers: [HomeworkService, HomeWorkResolver],
})
export class HomeWorkModule {}
