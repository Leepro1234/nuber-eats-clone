import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  AfterInsert,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
class PartialUser extends PartialType(User) {}

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Verification extends CoreEntity {
  @Column()
  @Field(() => String)
  code: string;

  //onDelete: 'CASCADE' 만약 User가 삭제되면 verificataion도 같이 삭제함.
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: PartialUser;

  @BeforeInsert()
  @BeforeUpdate()
  createCode(): void {
    this.code = uuidv4().replace('-', '');
  }
}
