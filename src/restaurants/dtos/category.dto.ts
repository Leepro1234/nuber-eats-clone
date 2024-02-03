import { Field, InputType, ObjectType } from '@nestjs/graphql';
import {
  PagenationInput,
  pagenationOutput,
} from 'src/common/dtos/pagenation.dto';
import { Category } from '../entities/category.entity';
import { Restaurant } from '../entities/restaurants.entity';

@InputType()
export class CategoryInput extends PagenationInput {
  @Field(() => String)
  slug: string;
}

@ObjectType()
export class CategoryOutput extends pagenationOutput {
  @Field(() => Category, { nullable: true })
  category: Category;

  //#11.16 퀴즈
  //TODO 카테고리안에 말고 밖에빼기위해 추가
  @Field(() => [Restaurant], { nullable: true })
  restaurants: Restaurant[];
}
