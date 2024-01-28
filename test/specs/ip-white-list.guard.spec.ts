import { Security } from '../../src';
import { Test } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppModule, EnvWhiteListProfile, NaiveWhiteListProfile } from '../fixtures';
import * as request from 'supertest';

@Controller('test1')
class TestController1 {
  @Get('single')
  @Security.CheckIpWhiteList(NaiveWhiteListProfile)
  allowSingleProfile() {
    return 'test';
  }

  @Get('multiple')
  @Security.CheckIpWhiteList(NaiveWhiteListProfile, EnvWhiteListProfile)
  allowMultipleProfiles() {
    return 'test';
  }

  @Get('no-profile')
  @Security.CheckIpWhiteList()
  noProfile() {
    return 'test';
  }

  @Get('no-decorator')
  noAllowDecorators() {
    return 'test';
  }
}

describe('IPCheckGuard', () => {
  let app: NestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController1],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('canActivate', () => {
    it('should return true when a request comes in without a decorator applied.', () => {
      return request(app.getHttpServer()).get('/test1/no-decorator').expect(HttpStatus.OK);
    });

    it('should return true when a request comes in without a security profile applied.', () => {
      return request(app.getHttpServer()).get('/test1/no-profile').expect(HttpStatus.OK);
    });

    it('should return true when a request comes in with a single profile applied and from an allowed IP address.', async () => {
      const requestIPAddress = ['127.0.0.1', '192.168.0.1', '192.168.0.2'];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/single')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.OK);
      }
    });

    it('should return true when a request comes in with multiple profiles applied and from an allowed IP address.', async () => {
      const requestIPAddress = ['127.0.0.1', '192.168.0.1', '192.168.0.2', '172.16.0.0'];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.OK);
      }
    });

    it('should return false when a request comes in with a single profile applied and not from an IP address.', async () => {
      const requestIPAddress = ['127.0.0.1', '192.168.0.1', '192.168.0.2'].map(
        (ip) => `${ip.slice(0, ip.length - 1)}255`,
      );

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/single')
          .set('X-Forwarded-For', ip)
          .expect({
            statusCode: HttpStatus.FORBIDDEN,
            message: `Forbidden IP address: ${ip}, profile name: NaiveWhiteListProfile`,
          });
      }
    });

    it('should return false when a request comes in with a multiple profile applied and not from an IP address.', async () => {
      const requestIPAddress = ['127.0.0.3'];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect({
            statusCode: HttpStatus.FORBIDDEN,
            message: `Forbidden IP address: ${ip}, profile name: NaiveWhiteListProfile, EnvWhiteListProfile`,
          });
      }
    });
  });
});
