import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpExceptionFilter } from './HttpExceptionFilter';
import * as Joi from 'joi';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { formmatError } from './ExceptionFormat';
import { Restaurant } from './restaurants/entities/restaurants.entity';
import { Category } from './restaurants/entities/category.entity';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { AuthModule } from './auth/auth.module';
import { Dish } from './restaurants/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entitiies/order.entity';
import { OrderItem } from './orders/entitiies/order-item.entity';
import { HomeWorkModule } from './homeworks/homeworks.module';
import { CommonModule } from './common/common.module';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { Context } from 'graphql-ws';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'debug'
          ? '.env.dev'
          : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod', //prod모드일때는 환경변수 파일 사용안하기
      validationSchema: Joi.object({
        //환경 변수 유효성 검사
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        PRIVATE_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_FROM_EMAIL: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod',
      logging:
        process.env.NODE_ENV !== 'prod' &&
        process.env.NODE_ENV !== 'test' &&
        process.env.NODE_ENV !== 'dev',
      entities: [
        User,
        Verification,
        Restaurant,
        Category,
        Dish,
        Order,
        OrderItem,
        Payment,
      ],
    }),
    //nestJS v9 다음 패키지로 설치해야하는듯 함
    //npm i @nestjs/graphql @nestjs/apollo @apollo/server graphql
    //모듈 임포트 문서 참조 https://docs.nestjs.com/graphql/quick-start
    GraphQLModule.forRoot<ApolloDriverConfig>({
      //미들웨어 > 컨텍스트 > 가드 > 데코레이터 > 리졸버
      driver: ApolloDriver,
      installSubscriptionHandlers: true,
      subscriptions: {
        'subscriptions-transport-ws': {
          onConnect: (connectionParams, WebSocket, context) => {
            //header는 ConnectionParams로 들어옴
            // console.log('context', context);
            // console.log('WebSocket', WebSocket);
            // console.log('connectionParams', connectionParams);
            console.log('test');
            return { token: connectionParams['x-jwt'] };
          },
          onDisconnect: (webSocket, context) => {
            // 연결 종료 시 작업 수행
            console.log('Client disconnected');
          },
        },
      },
      autoSchemaFile: true, //스키마를 메모리에 저장,
      context: ({ req }) => {
        //MiddleWare에서 리턴받은 req
        if (req) {
          return req;
        }
      },
      formatError: formmatError,
    }),
    JwtModule.forRoot({ privateKey: process.env.PRIVATE_KEY }),
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      fromEmail: process.env.MAILGUN_FROM_EMAIL,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    RestaurantsModule,
    OrdersModule,
    HomeWorkModule,
    CommonModule,
    PaymentsModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    //POST에 /graphql path만
    // consumer
    //   .apply(JwtMiddleware)
    //   .forRoutes({ path: '/graphql', method: RequestMethod.POST });
    //모든 path에 모든 메소드일때
    // consumer
    //   .apply(JwtMiddleware)
    //   .forRoutes({ path: '*', method: RequestMethod.ALL });
    // /api Path는 제외하고
    // consumer
    //   .apply(JwtMiddleware)
    //   .exclude({ path: '/api', method: RequestMethod.ALL });
    consumer
      .apply(JwtMiddleware)
      .forRoutes({ path: '/graphql', method: RequestMethod.ALL });
  }
}
