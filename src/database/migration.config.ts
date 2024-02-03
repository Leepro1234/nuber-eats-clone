import { Category } from 'src/restaurants/entities/category.entity';
import { Restaurant } from 'src/restaurants/entities/restaurants.entity';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
function connectionOptions(): DataSourceOptions {
  const env = dotenv.config({
    path: `.env.test`,
  });
  console.log(process.env.DB_HOST);
  return {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV !== 'prod',
    logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
    entities: [User, Verification, Restaurant, Category],
    migrations: ['src/database/migration/test/*.ts'],
    migrationsTableName: 'migrations',
  };
}

const datasource = new DataSource(connectionOptions());
export default datasource;
