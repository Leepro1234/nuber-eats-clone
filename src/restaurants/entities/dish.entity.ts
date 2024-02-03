import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  Column,
  Entity,
  IsNull,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { Restaurant } from './restaurants.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  name: string;
  @Field(() => Number, { nullable: true })
  extra?: number;
}
@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(() => String)
  name: string;
  @Field(() => [DishChoice], { nullable: true })
  choices?: DishChoice[];
  @Field(() => Number, { nullable: true })
  extra?: number;
}
//와우 !! GraphQL과 TypeORM의 데코레이터를 같이 쓸수잇다니 어썸 !
@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(() => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field(() => Number)
  @Column()
  @IsNumber()
  price: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo: string;

  @Field(() => String)
  @Column()
  @Length(5, 140)
  description: string;

  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, restaurant => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  //dishOption > 피자 맛 같은거임 하와이안, 김치 피자 등등
  //mysql, postgresql에서만 지원
  //Entity로 Relationship을 맺어도되지만 create, delete, update, insert등 신경써야할게 많아져서 불편하대s
  @Field(() => [DishOption], { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  options?: DishOption[];
}
