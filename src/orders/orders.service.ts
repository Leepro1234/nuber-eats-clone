import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlobOptions } from 'buffer';
import e from 'express';
import { stat } from 'fs';
import { isCompositeType } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { EditDishInput } from 'src/restaurants/dtos/edit-dish.dto';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { CreateAccountInput } from 'src/users/dtos/create-account..dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetGordersInput, GetGordersOutput } from './dtos/get-gorders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { OrderItem } from './entitiies/order-item.entity';
import { Order, OrderStatus } from './entitiies/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItemds: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  async createOrder(
    customer: User,
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      console.log('tt');
      const restaurant = await this.restaurants.findOne({
        where: { id: createOrderInput.restaurantId },
      });

      if (!restaurant) {
        throw new CustomError(ErrorCode.NOT_FOUND_RESTAURANT);
      }

      // TODO : For of Loop 작성
      let total = 0;
      const orderItems: OrderItem[] = [];
      for (const item of createOrderInput.items) {
        const dish = await this.dishes.findOne({
          where: { id: item.dishId },
        });
        if (!dish) {
          throw new CustomError(ErrorCode.NOT_FOUND_DISH);
        }

        let finalDishPrice = dish.price;
        console.log(`Dish Price ${dish.price}`);
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            dishOption => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              console.log(`USD + ${dishOption.extra}`);
              finalDishPrice = finalDishPrice + dishOption.extra;
            }
            if (dishOption.choices) {
              const dishOptionChoice = dishOption.choices.find(
                optionChoice => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice && dishOptionChoice.extra) {
                console.log(`USD + ${dishOptionChoice.extra}`);
                finalDishPrice = finalDishPrice + dishOptionChoice.extra;
              }
            }
          }
        }
        total = total + finalDishPrice;
        console.log(`USD + ${finalDishPrice}`);

        const orderItem = await this.orderItemds.save(
          this.orderItemds.create({ dish, options: item.options }),
        );
        orderItems.push(orderItem);
      }
      //console.log(`finalOrderPrice = USD + ${total}`);

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total,
          items: orderItems,
        }),
      );

      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return {
        ok: true,
      };
    } catch (e) {
      throw e;
    }
  }

  async getOrders(
    user: User,
    { status }: GetGordersInput,
  ): Promise<GetGordersOutput> {
    let orders: Order[];
    if (user.role === UserRole.Client) {
      //undefined면 전부 다가져오내 니코랑 다르다
      orders = await this.orders.find({
        where: { customer: { id: user.id }, ...(status && { status }) },
        relations: ['customer'],
      });
    } else if (user.role === UserRole.Delivery) {
      orders = await this.orders.find({
        where: { driver: { id: user.id }, ...(status && { status }) },
      });
    } else if (user.role === UserRole.Owner) {
      const restaurants = await this.restaurants.find({
        //난왜 오너:user 조건 걸면안될까
        //TODO : 이부분 이렇게 했다고 말해주기
        where: { owner: user },
        relations: ['orders'],
      });
      orders = restaurants.map(restaurant => restaurant.orders).flat(1);
      if (status) {
        orders = orders.filter(order => order.status === status);
      }
    }
    console.log(orders);

    return {
      ok: true,
      orders: orders,
    };
  }

  checkSeeOrder(user: User, order: Order): boolean {
    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }
    return canSee;
  }
  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id: orderId },
        relations: ['restaurant', 'items'],
      });
      if (!order) {
        throw new Error('주문을 찾기 못했습니다');
      }

      if (!this.checkSeeOrder(user, order)) {
        throw new Error('주문을 찾지 못했습니다.');
      }
      console.log(order);

      return {
        ok: true,
        order,
      };
    } catch (e) {
      throw e;
    }
  }

  async editOrder(
    user: User,
    editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id: editOrderInput.id },
      });
      const customers = await order.customer;
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다');
      }

      if (!this.checkSeeOrder(user, order)) {
        throw new Error('주문을 찾지 못했습니다.');
      }

      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      if (user.role === UserRole.Owner) {
        if (
          editOrderInput.status !== OrderStatus.Cooking &&
          editOrderInput.status !== OrderStatus.Cooked
        ) {
          canEdit = false;
        }
      }

      if (user.role === UserRole.Delivery) {
        if (
          editOrderInput.status !== OrderStatus.PickedUp &&
          editOrderInput.status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        throw new Error('주문을 수정할 수 없습니다.');
      }
      // console.log(
      //   this.orders.create({ ...order, status: editOrderInput.status }),
      // );

      const newOrder = { ...order, status: editOrderInput.status };
      await this.orders.save(this.orders.create(newOrder));

      if (
        user.role === UserRole.Owner &&
        editOrderInput.status === OrderStatus.Cooked
      ) {
        await this.pubSub.publish(NEW_COOKED_ORDER, {
          cookedOrders: newOrder,
        });
      }

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: newOrder,
      });

      return {
        ok: true,
      };
    } catch (e) {
      throw e;
    }
  }

  async takeOrder(
    user: User,
    { id }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne({ where: { id } });
      if (!order) {
        throw new Error('주문을 찾지 못했습니다.');
      }

      if (order.driver) {
        throw new Error('이미 배달부가 정해졌습니다. ');
      }

      await this.orders.save({
        id,
        driver: user,
      });

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver: user },
      });
      return {
        ok: true,
      };
    } catch (e) {
      throw new Error(e);
    }
  }
}
