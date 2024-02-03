import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToMany, ManyToOne, RelationId } from 'typeorm';

//음식점 홍보용
@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field(() => Number)
  @Column()
  transactionId: number;

  @Field(() => User)
  @ManyToOne(type => User, user => user.payments)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  //restaurant는 payments를 몰라도되기때문에 user랑은 다르게사용함
  @Field(() => Restaurant)
  @ManyToOne(type => Restaurant)
  restaurant: Restaurant;

  @Field(() => Number)
  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
