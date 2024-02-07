import { Inject } from '@nestjs/common';
import {
  Args,
  Context,
  Mutation,
  Query,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetGordersInput, GetGordersOutput } from './dtos/get-gorders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { OrderUpdatesInput } from './dtos/order-updates.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { Order } from './entitiies/order.entity';
import { OrderService } from './orders.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUB_SUB)
    private readonly pubSub: PubSub,
  ) {}

  @Mutation(returns => CreateOrderOutput)
  @Role(['Client'])
  createOrder(
    @AuthUser() AuthUser,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    console.log('ttt');
    return this.orderService.createOrder(AuthUser, createOrderInput);
  }

  @Query(returns => GetGordersOutput)
  @Role(['Any'])
  getOrders(
    @AuthUser() authUser: User,
    @Args('input') getOrdersInput: GetGordersInput,
  ): Promise<GetGordersOutput> {
    return this.orderService.getOrders(authUser, getOrdersInput);
  }

  @Query(returns => GetOrderOutput)
  @Role(['Any'])
  getOrder(
    @AuthUser() authUser: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.orderService.getOrder(authUser, getOrderInput);
  }

  @Mutation(returns => EditOrderOutput)
  @Role(['Any'])
  editOrder(
    @AuthUser() authUser: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.orderService.editOrder(authUser, editOrderInput);
  }

  @Mutation(() => Boolean)
  potatoReady(@Args('potatoId') potatoId: number) {
    this.pubSub.publish('hotPotatos', {
      readyPotatos: potatoId,
    });
    return true;
  }

  @Subscription(() => String, {
    /**
     *
     * @param payload Mutation에서 넘어온 데이터
     * @param variables Subscription에서 사용한 파라미터
     * @param context  컨텍스트
     * @returns
     */
    filter: ({ readyPotatos }, { potatoId }, context) => {
      console.log(context);
      return readyPotatos === potatoId;
    },
    resolve: ({ readyPotatos }) => {
      return `Your Potato with ID : ${readyPotatos}`;
    },
  })
  @Role(['Any'])
  readyPotatos(
    @Args('potatoId') potatoId: number,
    @AuthUser() user,
    @Context() context: any,
  ) {
    //app.module에서 리턴한걸 가져옴
    return this.pubSub.asyncIterator('hotPotatos');
  }

  @Subscription(() => Order, {
    filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
      return ownerId === user.id;
    },
    resolve: ({ pendingOrders: { order } }) => order,
  })
  @Role(['Owner'])
  pendingOrders() {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  @Subscription(() => Order)
  @Role(['Delivery'])
  cookedOrders() {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  @Subscription(() => Order, {
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input: { id } }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      if (
        order.driverId !== user.id &&
        order.customerId !== user.id &&
        order.restaurant.ownerId !== user.id
      ) {
        return false;
      }
      return order.id === id;
    },
  })
  @Role(['Any'])
  orderUpdates(@Args('input') orderUpdatesInput: OrderUpdatesInput) {
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }

  @Mutation(() => TakeOrderOutput)
  @Role(['Delivery'])
  takeOrder(
    @AuthUser() user: User,
    @Args('input') takeOrderInput: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    return this.orderService.takeOrder(user, takeOrderInput);
  }
}
