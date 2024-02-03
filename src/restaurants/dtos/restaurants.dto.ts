import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PagenationInput,
  pagenationOutput,
} from 'src/common/dtos/pagenation.dto';
import { Restaurant } from '../entities/restaurants.entity';

@InputType()
export class RestaurantsInput extends PagenationInput {}

@ObjectType()
export class RestaurantsOutput extends pagenationOutput {
  @Field(() => [Restaurant], { nullable: true })
  results?: Restaurant[];
}
