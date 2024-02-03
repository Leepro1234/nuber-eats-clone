import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurants.entity';

//와우 !! GraphQL과 TypeORM의 데코레이터를 같이 쓸수잇다니 어썸 !
@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  @Length(5, 10)
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImg: string;

  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  slug: string;

  //GraphQL Array는 이렇게 씀
  @Field(() => [Restaurant], { nullable: true })
  @OneToMany(() => Restaurant, restaurant => restaurant.category)
  restaurants?: Restaurant[];
}
