import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from 'src/common/types/exception.types';
import { CustomError } from 'src/HttpExceptionFilter';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
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
    private schedulerRegistry: SchedulerRegistry,
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

  //매 30초에
  @Cron('30 * * * * *', { name: 'cronJob' })
  async checkForPayments() {
    console.log(`Checking for Payments(cron)`);
    const job = this.schedulerRegistry.getCronJob('cronJob');
    console.log(job);
    job.stop();
  }

  //5초마다
  @Interval(5000)
  async checkForPaymentsInterval() {
    console.log('Checking for Payments(interval)');
  }

  //앱을실행하고 20초뒤에 한번만 실행됨
  @Timeout(20000)
  async afterStarts() {
    console.log('Checking for Payments(timeout)');
  }
}
