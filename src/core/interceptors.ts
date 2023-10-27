import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import Redis from 'ioredis';
import { Mutex } from 'redis-semaphore';
import { Observable, finalize } from 'rxjs';

export enum MutexType {
  TYPEORM = 'TypeormMutex',
  REDIS = 'RedisMutex',
  BASE = 'BasicMutex',
}

export class MutexSet {
  public static TypeormMutex: MutexTypeorm = null;
  public static RedisMutex: MutexRedis = null;
  public static BasicMutex = false;
}

// *********** TYPEORM ***********
export class MutexTypeorm {
  private dbManager = null;
  private mutexId = null;

  constructor(dbManager, mutexId) {
    this.dbManager = dbManager;
    this.mutexId = mutexId;
  }

  async lock(): Promise<boolean> {
    try {
      const qr = await this.dbManager.createQueryRunner();
      await qr.startTransaction();
      try {
        await qr.query(
          `SELECT * from locks where id=${this.mutexId} for update`,
        );
      } catch (e) {
        await qr.commitTransaction();
        await qr.release();
        return false;
      }
      return qr;
    } catch (e) {
      return false;
    }
  }

  async unlock(qr): Promise<boolean> {
    if (qr) {
      try {
        await qr.commitTransaction();
        await qr.release();
      } catch (e) {
        await qr.release();
        return false;
      }
    }
    return true;
  }
}

@Injectable()
export class MutexTypeormInterceptor implements NestInterceptor {
  constructor(private readonly mutexType: MutexType) {}

  async intercept<T>(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<T>> {
    let mutexAllocated = false;

    if (MutexSet[this.mutexType]) {
      mutexAllocated = await MutexSet[
        this.mutexType as MutexType.TYPEORM
      ].lock();
    }

    return next.handle().pipe(
      finalize(async () => {
        if (mutexAllocated) {
          await MutexSet[this.mutexType as MutexType.TYPEORM].unlock(
            mutexAllocated,
          );
        }
      }),
    );
  }
}

// *********** REDIS ***********
export class MutexRedis {
  private redisClient = null;
  private mutex = null;

  constructor() {
    this.redisClient = new Redis();
    this.mutex = new Mutex(this.redisClient, 'lockingResource');
  }

  async lock(): Promise<Mutex> {
    await this.mutex.acquire();
    try {
      return this.mutex;
    } catch (e) {
      await this.mutex.release();
    }
  }

  async unlock(mutex: Mutex): Promise<boolean> {
    if (mutex) {
      try {
        await mutex.release();
      } catch (e) {
        await mutex.release();
        return false;
      }
    }
    return true;
  }
}

@Injectable()
export class MutexRedisInterceptor implements NestInterceptor {
  constructor(private readonly mutexType: MutexType) {}

  async intercept<T>(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<T>> {
    let mutexAllocated: Mutex;

    if (MutexSet[this.mutexType]) {
      console.log('Interceptor by redis is invoked?');
      mutexAllocated = await MutexSet[this.mutexType as MutexType.REDIS].lock();
    }

    return next.handle().pipe(
      finalize(async () => {
        if (mutexAllocated) {
          await MutexSet[this.mutexType as MutexType.REDIS].unlock(
            mutexAllocated,
          );
        }
      }),
    );
  }
}

// *********** BASIC ***********
@Injectable()
export class MutexInterceptorBasic implements NestInterceptor {
  constructor(private readonly mutexType: MutexType) {}

  async intercept<T>(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<T>> {
    let mutexAllocated = false;

    if (MutexSet[this.mutexType]) {
      return;
    }

    MutexSet[this.mutexType as MutexType.BASE] = true;
    mutexAllocated = true;

    return next.handle().pipe(
      finalize(async () => {
        if (mutexAllocated) {
          MutexSet[this.mutexType as MutexType.BASE] = false;
          mutexAllocated = false;
        }
      }),
    );
  }
}
