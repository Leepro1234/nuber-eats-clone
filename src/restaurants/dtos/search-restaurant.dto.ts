import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import {
  PagenationInput,
  pagenationOutput,
} from 'src/common/dtos/pagenation.dto';
import { Restaurant } from '../entities/restaurants.entity';

@InputType()
export class SearchRestaurantInput extends PagenationInput {
  @Field(() => String)
  keyword: string;
}

@ObjectType()
export class SearchRestaurantOutput extends pagenationOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
