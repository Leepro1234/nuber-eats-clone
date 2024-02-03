import {
  Field,
  InputType,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from '../entitiies/order.entity';

@ObjectType()
export class ChildOrder {
  @Field(() => Number)
  id: number;

  @Field(() => Number, { nullable: true })
  total?: number;

  @Field(() => User, { nullable: true })
  customer?: User;

  @Field(() => User, { nullable: true })
  driver?: User;

  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;
}

@InputType()
export class GetGordersInput {
  @Field(() => OrderStatus, { nullable: true })
  status?: OrderStatus;
}
@ObjectType()
export class GetGordersOutput extends CoreOutput {
  @Field(() => [ChildOrder], { nullable: true })
  orders?: ChildOrder[];
}
