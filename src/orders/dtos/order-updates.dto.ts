import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entitiies/order.entity';

@InputType()
export class OrderUpdatesInput extends PickType(Order, ['id']) {}
