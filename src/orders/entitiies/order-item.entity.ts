import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@ObjectType()
@InputType('OrderItemOptionInputType')
export class OrderItemOption {
  @Field(() => String)
  name: string;
  @Field(() => String, { nullable: true })
  choice?: string;
}
@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @Field(() => Dish, { nullable: true })
  @ManyToOne(type => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish?: Dish;

  //Json타입을 사용한이유:
  //현재 니코강의의 DB구조를 보면, Entity를 만들고 Reslation을 맺게되면
  //주인이 옵션의 변경사항이 있어서 변경하게되면 Order의 옵션들도 영향을 받게되기때문에, Text를 고수함
  @Field(() => [OrderItemOption], { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  options?: OrderItemOption[];
}
