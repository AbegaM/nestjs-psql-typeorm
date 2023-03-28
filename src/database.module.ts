import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config" 
import { TypeOrmModule } from "@nestjs/typeorm"
import { join } from 'path'
import Todo from "./todo.entity"

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],

            useFactory: (configService: ConfigService) => ({
                type: 'postgres', 
                host: configService.get('POSTGRES_HOST'),
                port: configService.get('POSTGRES_PORT'),
                username: configService.get('POSTGRES_USER'),
                password: configService.get('POSTGRES_PASSWORD'),
                database: configService.get('POSTGRES_DB'), 
                //entities: [join(__dirname, '**', '*.entity.{ts,js')],
                entities: [Todo],
                synchronize: true, //should be false in production
            })
      })
  ]
})

export class DatabaseModule {}