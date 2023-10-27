import { MutexTypeorm, MutexSet, MutexRedis } from './core/interceptors';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from './database/entities/users.entity';
import { Repository } from 'typeorm';
import { Sleep } from './core/sleep';
import { Locks } from './database/entities/locks.entity';
import {
  AsyncMutexService,
  RedisMutexService,
  RedisSemaphoreService,
} from './core/services';

export interface Response {
  message: string;
}

@Injectable()
export class AppService {
  private mutexTypeorm: MutexTypeorm = null;
  private mutexRedis: MutexRedis = null;

  constructor(
    @InjectRepository(Users)
    private readonly locksRepository: Repository<Locks>,
    private readonly asyncMutexService: AsyncMutexService,
    private readonly redisMutexService: RedisMutexService,
    private readonly redisSemaphoreService: RedisSemaphoreService,
  ) {
    this.locksRepository.manager.query(
      `insert into locks (id) values (123459) on conflict do nothing`,
    );
    (this.mutexTypeorm = new MutexTypeorm(
      this.locksRepository.manager.connection,
      123459,
    )),
      (MutexSet.TypeormMutex = this.mutexTypeorm);
    (this.mutexRedis = new MutexRedis()),
      (MutexSet.RedisMutex = this.mutexRedis);
    // MutexSet.BasicMutex = true;
  }

  // ********* BY INTERCEPTORS ***********
  async invokeTypeormMutexInterceptor(): Promise<Response> {
    console.log('invokeTypeormMutexInterceptor');
    await Sleep(10000);
    return {
      message: 'Operation completed!',
    };
  }

  async invokeRedisMutexInceptor(): Promise<Response> {
    console.log('invokeRedisMutexInceptor');
    await Sleep(10000);
    return {
      message: 'Operation completed!',
    };
  }

  // second operation does't wait in the queue
  async basicMutexInceptor(): Promise<Response> {
    console.log('basicMutexInceptor');
    await Sleep(10000);
    return {
      message: 'Operation completed!',
    };
  }

  // ********* BY SERVICES ***********
  async invokeAsyncLibMutexService(): Promise<Response> {
    return await this.asyncMutexService.runLocked(async () => {
      console.log('invokeAsyncLibMutexService');
      await Sleep(10000);
      return {
        message: 'Operation completed!',
      };
    });
  }

  async invokeRedisMutexService(): Promise<Response> {
    return await this.redisMutexService.runLocked(async () => {
      console.log('invokeRedisMutexService');
      await Sleep(10000);
      return {
        message: 'Operation completed!',
      };
    });
  }

  async invokeRedisSemaphoreService(): Promise<Response> {
    return await this.redisSemaphoreService.runLocked(async () => {
      console.log('invokeRedisSemaphoreService');
      await Sleep(10000);
      return {
        message: 'Operation completed!',
      };
    });
  }
}
