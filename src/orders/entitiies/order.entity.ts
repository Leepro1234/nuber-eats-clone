import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });
//와우 !! GraphQL과 TypeORM의 데코레이터를 같이 쓸수잇다니 어썸 !
@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @ManyToOne(type => User, user => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @Field(() => User, { nullable: true })
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @ManyToOne(type => User, user => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @Field(() => User, { nullable: true })
  driver: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @ManyToOne(type => Restaurant, restaurant => restaurant.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @ManyToMany(type => OrderItem, { eager: true })
  @Field(() => [OrderItem])
  @JoinTable() //메인이 될 곳 에 넣는다 (Order는 어떤 dish가 있는지 알 수 있음) 자동으로 접합 테이블이 생성됌 !
  items: OrderItem[];

  @Column({ nullable: true })
  @Field(() => Float, { nullable: true })
  @IsNumber()
  total?: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
