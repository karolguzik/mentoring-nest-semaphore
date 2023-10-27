import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './database/entities/users.entity';
import configuration from './config/app.config';
import {
  AsyncMutexService,
  RedisMutexService,
  RedisSemaphoreService,
} from './core/services';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AsyncMutexService,
    RedisMutexService,
    RedisSemaphoreService,
  ],
})
export class AppModule {}
