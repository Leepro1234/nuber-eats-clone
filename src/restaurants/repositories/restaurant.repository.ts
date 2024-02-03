import { QueryOptions } from 'src/common/interfaces/query.interfaces';
import { CustomRepository } from 'src/typeorm/custom.repository.decorator';
import { Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurants.entity';

@CustomRepository(Restaurant)
export class RestaurantRepository extends Repository<Restaurant> {
  async selectPagedResult(
    page,
    where?: Record<string, any>,
  ): Promise<[Restaurant[], number]> {
    return await this.findAndCount({
      where,
      skip: (page - 1) * 25,
      take: 25,
    });
  }

  async selectPagedResult2(
    queryOptions: QueryOptions,
    page,
  ): Promise<[Restaurant[], number]> {
    return await this.findAndCount({
      ...queryOptions,
      skip: (page - 1) * 25,
      take: 25,
    });
  }
}
