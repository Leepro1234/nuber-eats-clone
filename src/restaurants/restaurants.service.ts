import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryOptions } from 'src/common/interfaces/query.interfaces';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { User } from 'src/users/entities/user.entity';
import { Like, Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant-dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant-dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurants.entity';
import { CategoryRepository } from './repositories/category.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { TestRepository } from './repositories/test.repository';

@Injectable()
export class RestaurantsService {
  constructor(
    // @InjectRepository(Restaurant)
    // private readonly restaurants: Repository<Restaurant>,
    // @InjectRepository(Category)
    // private readonly categories: Repository<Category>,
    private readonly test: TestRepository,
    private readonly categories: CategoryRepository,
    private readonly restaurants: RestaurantRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async findAndCheckOwner(
    ownerId: number,
    restaurantId: number,
  ): Promise<void> {
    const restaurnt = await this.restaurants.findOne({
      where: { id: restaurantId },
    });
    if (!restaurnt) {
      throw new CustomError(ErrorCode.NOT_FOUND_RESTAURANT);
    }
    if (ownerId !== restaurnt.ownerId) {
      throw new CustomError(ErrorCode.NOT_MATCH_OWNER);
    }
  }

  //현재 페이지*카운트개수 부터 인덱스시작
  addIndexToItems<T>(items: T[], page: number): T[] {
    return items.map((item, index) => ({
      ...item,
      index: (page - 1) * 25 + index + 1,
    }));
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;

      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (e) {
      console.log(e);
      throw new CustomError(10000);
    }
  }

  async EditRestauant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      await this.findAndCheckOwner(owner.id, editRestaurantInput.restaurantId);

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      //오너고 레스토랑이 있음
      return { ok: true };
    } catch (e) {
      return { ok: false };
    }
  }

  async DeleteRestaurantInput(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    await this.findAndCheckOwner(owner.id, restaurantId);

    await this.restaurants.delete(restaurantId);

    return { ok: true };
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalCount] = await this.restaurants.findAndCount({
        skip: (page - 1) * 25,
        take: 25,
        order: {
          isPromoted: 'DESC',
        },
      });

      console.log(restaurants);
      console.log(typeof restaurants);
      return {
        ok: true,
        results: this.addIndexToItems(restaurants, page),
        totalPages: Math.ceil(totalCount / 25),
        totalCount,
      };
    } catch (e) {
      throw new CustomError(ErrorCode.NOT_LOAD_RESTAURANTS);
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
        relations: ['menu'],
      });
      return {
        ok: true,
        restaurant,
      };
    } catch (e) {
      throw new CustomError(ErrorCode.NOT_FOUND_RESTAURANT);
    }
  }

  async searchRestaurantByName(
    searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    try {
      // const [restaurants, totalCount] = await this.restaurants.findAndCount({
      //   // where: { name: Like(`%${searchRestaurantInput.keyword}%`) },
      //   // where: {
      //   //   name: Raw(name => `${name} LIKE '%${restaurants.keyword}%'`),
      //   // },
      //   skip: (searchRestaurantInput.page - 1) * 25,
      //   take: 25,
      // });

      const [restaurants, totalCount] =
        await this.restaurants.selectPagedResult(searchRestaurantInput.page, {
          name: Like(`%${searchRestaurantInput.keyword}%`),
        });

      // const queryOptions: QueryOptions = {};
      // queryOptions.where = { name: Like(`%${searchRestaurantInput.keyword}%`) };

      // const [restaurants, totalCount] =
      //   await this.restaurants.selectPagedResult2(
      //     queryOptions,
      //     searchRestaurantInput.page,
      //   );

      return {
        ok: true,
        totalCount,
        totalPages: Math.ceil(totalCount / 25),
        restaurants: this.addIndexToItems(
          restaurants,
          searchRestaurantInput.page,
        ),
      };
    } catch (e) {
      throw new CustomError(ErrorCode.NOT_FOUND_RESTAURANT);
    }
  }

  /**
   * 카테고리 영역
   */

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories: categories,
      };
    } catch (e) {
      throw new CustomError(ErrorCode.NOT_LOAD_CATEGORIES);
    }
  }

  async countRestaurants(category: Category): Promise<number> {
    return await this.restaurants.count({
      where: { category: { id: category.id } },
    });
  }

  async findCategoryBySlug({ slug, page }): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug: slug },
        relations: ['restaurants'],
      });

      const restaurants = await this.restaurants.find({
        where: { category: { id: category.id } },
        take: 25,
        skip: (page - 1) * 25,
        order: {
          isPromoted: 'DESC',
        },
      });

      category.restaurants = restaurants.map((restaurant, index) => ({
        ...restaurant,
        index: (page - 1) * 25 + index + 1, // 인덱스는 1부터 시작하도록
      }));

      const totalResults = await this.countRestaurants(category);

      if (!category) {
        throw new CustomError(ErrorCode.NOT_LOAD_CATEGORIES);
      }
      return {
        ok: true,
        category,
        restaurants: restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalCount: Math.ceil(totalResults),
      };
    } catch (e) {
      console.log(e);
      throw new CustomError(ErrorCode.NOT_LOAD_CATEGORIES);
    }
  }

  /**
   *
   * 디쉬 영역
   */

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    const restaurant = await this.restaurants.findOne({
      where: { id: createDishInput.restaurantId },
    });
    try {
      if (!restaurant) {
        //TODO Error처리 필요
        return {
          ok: false,
          error: 'restaurant Not found',
        };
      }

      if (owner.id !== (await restaurant).ownerId) {
        //TODO Error처리 필요
        return {
          ok: false,
          error: '권한이 없습니다.',
        };
      }

      const dish = this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      console.log(dish);
      return { ok: true };
    } catch (error) {
      //TODO Error처리 필요
      console.log(error);
      return { ok: false, error };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      console.log(owner.id);
      const dish = await this.dishes.findOne({
        where: { id: dishId },
        relations: ['restaurant'],
      });
      console.log(dish);
      if (!dish) {
        return {
          ok: false,
          error: 'Dish Not Found',
        };
      }

      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: '권한이 없습니다.',
        };
      }

      await this.dishes.delete(dishId);
      return {
        ok: true,
      };
    } catch (error) {
      //TODO Error처리 필요
      console.log(error);
      return { ok: false, error };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: editDishInput.dishId },
        relations: ['restaurant'],
      });

      if (!dish) {
        return {
          ok: false,
          error: 'Dish Not Found',
        };
      }

      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: '권한이 없습니다.',
        };
      }

      //파라미터 부분에서 풀어서 갖고오지 않는 이유는 파라미터 부분에서 풀면 만약 값이 없으면 undefined다
      await this.dishes.save([{ id: editDishInput.dishId, ...editDishInput }]);
      return {
        ok: true,
      };
    } catch (error) {
      //TODO Error처리 필요
      console.log(error);
      return { ok: false, error };
    }
  }

  ch;
}
