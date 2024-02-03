import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmCustomModule } from 'src/typeorm/typeorm.module';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurants.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { TestRepository } from './repositories/test.repository';
import {
  CategoryResolver,
  DishResolver,
  RestaurantResolver,
} from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Category, Dish]),
    TypeOrmCustomModule.forCustomRepository([
      TestRepository,
      CategoryRepository,
      RestaurantRepository,
    ]),
  ],
  providers: [
    RestaurantResolver,
    RestaurantsService,
    CategoryResolver,
    DishResolver,
  ],
})
export class RestaurantsModule {}
