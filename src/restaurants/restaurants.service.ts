import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createPaymentInput.restaurantId },
      });

      if (!restaurant) {
        throw new CustomError(ErrorCode.NOT_FOUND_RESTAURANT);
      }

      if (restaurant.ownerId !== owner.id) {
        throw new Error('당신은 결제 권한이 없습니다.');
      }

      await this.payments.save(
        this.payments.create({
          transactionId: createPaymentInput.transactionId,
          user: owner,
          restaurant,
        }),
      );

      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;

      this.restaurants.save(restaurant);

      return {
        ok: true,
      };
    } catch (e) {
      throw e;
    }
  }

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({
        where: { user: { id: owner.id } },
      });

      return {
        ok: true,
        payments,
      };
    } catch (e) {
      throw e;
    }
  }

  @Interval(2000)
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      where: { isPromoted: true, promotedUntil: LessThan(new Date()) }, //프로모션일자가 오늘보다 적은 것들 조회
    });
    console.log(restaurants);
    restaurants.forEach(async restraunt => {
      restraunt.isPromoted = false;
      restraunt.promotedUntil = null;
      await this.restaurants.save(restraunt);
    });
  }
}
