import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { TodoModule } from './todo.module';


@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: '.env', 
    validationSchema: Joi.object({
      POSTGRES_HOST: Joi.string().required(), 
      POSTGRES_PORT: Joi.number().required(),
      POSTGRES_USER: Joi.string().required(),
      POSTGRES_PASSWORD: Joi.string().required(),
      POSTGRES_DB: Joi.string().required(),
      PORT: Joi.number()
    })
  }), DatabaseModule, TodoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
