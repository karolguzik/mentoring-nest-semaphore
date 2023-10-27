import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AppService, Response } from './app.service';
import {
  MutexInterceptorBasic,
  MutexRedisInterceptor,
  MutexType,
  MutexTypeormInterceptor,
} from './core/interceptors';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ********* BY INTERCEPTORS ***********
  @UseInterceptors(new MutexTypeormInterceptor(MutexType.TYPEORM))
  @Get('interceptor/typeorm')
  async invokeTypeormMutexInterceptor(): Promise<Response> {
    return await this.appService.invokeTypeormMutexInterceptor();
  }

  @UseInterceptors(new MutexRedisInterceptor(MutexType.REDIS))
  @Get('interceptor/redis')
  async invokeRedisMutexInceptor(): Promise<Response> {
    return await this.appService.invokeRedisMutexInceptor();
  }

  @UseInterceptors(new MutexInterceptorBasic(MutexType.BASE))
  @Get('interceptor/basic')
  async basicsMutexInceptor(): Promise<Response> {
    return await this.appService.basicMutexInceptor();
  }

  // ********* BY SERVICES ***********
  @Get('service/async-mutex')
  async invokeAsyncLibMutexService(): Promise<Response> {
    return await this.appService.invokeAsyncLibMutexService();
  }

  @Get('service/redis')
  async invokeRedisMutexService(): Promise<Response> {
    return await this.appService.invokeRedisMutexService();
  }
}
