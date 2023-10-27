import { Injectable } from '@nestjs/common';
import { Mutex as AsyncMutex } from 'async-mutex';
import {
  Mutex as RedisMutex,
  MultiSemaphore as RedisSemaphore,
} from 'redis-semaphore';
import Redis from 'ioredis';

// ********* ASYNC MUTEX ***********
@Injectable()
export class AsyncMutexService {
  private mutex = new AsyncMutex();

  async runLocked<T>(callback: () => Promise<T>): Promise<T> {
    const release = await this.mutex.acquire();
    try {
      return await callback();
    } catch (e) {
    } finally {
      release();
    }
  }
}

// ********* REDIS ***********
@Injectable()
export class RedisMutexService {
  private redisClient: Redis;
  private mutex: RedisMutex;
  constructor() {
    this.redisClient = new Redis();
    this.mutex = new RedisMutex(this.redisClient, 'lockingResource');
  }
  async runLocked<T>(callback: () => Promise<T>): Promise<T> {
    await this.mutex.acquire();
    try {
      return await callback();
    } catch (e) {
      await this.mutex.release();
    } finally {
      await this.mutex.release();
    }
  }
}

// ********* REDIS ***********
// with 2 simultaneously executions
@Injectable()
export class RedisSemaphoreService {
  private redisClient: Redis;
  private mutex: RedisMutex;
  private semaphore: RedisSemaphore;
  constructor() {
    this.redisClient = new Redis();
    this.semaphore = new RedisSemaphore(
      this.redisClient,
      'lockingResource',
      2,
      2,
      {
        lockTimeout: 30 * 1e3, // 30sec
      },
    );
  }
  async runLocked<T>(callback: () => Promise<T>): Promise<T> {
    await this.semaphore.acquire();
    try {
      return await callback();
    } catch (e) {
      await this.semaphore.release();
    } finally {
      await this.semaphore.release();
    }
  }
}
