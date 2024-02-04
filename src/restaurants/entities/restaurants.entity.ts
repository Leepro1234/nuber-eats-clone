import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/orders/entitiies/order.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
  UsingJoinColumnIsNotAllowedError,
} from 'typeorm';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

//와우 !! GraphQL과 TypeORM의 데코레이터를 같이 쓸수잇다니 어썸 !
@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  name: string;

  @Field(() => String)
  @Column()
  @IsString()
  address: string;

  @Field(() => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(() => Category, { nullable: true })
  @JoinColumn()
  @ManyToOne(() => Category, category => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category;

  @Field(() => User)
  @ManyToOne(() => User, user => user.restaurants, {
    onDelete: 'CASCADE',
    eager: true,
  })
  owner: User;

  @Field(type => [Order])
  @OneToMany(type => Order, order => order.restaurant)
  orders: Order[];

  //이 데코레이터 사용시 조인테이블 컬럼 중 OwnerID만 뽑아올 수 있음
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(() => Number, { nullable: true })
  index?: number;

  @Field(() => [Dish])
  @OneToMany(() => Dish, dish => dish.restaurant)
  menu: Dish[];

  @Field(() => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil: Date;
}
