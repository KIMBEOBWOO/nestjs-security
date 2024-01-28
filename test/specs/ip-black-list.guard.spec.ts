import { Security } from '../../src';
import { Test } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import { AppModule, NaiveBlackListProfile, EnvBlackListProfile } from '../fixtures';
import * as request from 'supertest';

@Controller('test1')
class TestController1 {
  @Get('single')
  @Security.CheckIpBlackList(NaiveBlackListProfile)
  allowSingleProfile() {
    return 'test';
  }

  @Get('multiple')
  @Security.CheckIpBlackList(NaiveBlackListProfile, EnvBlackListProfile)
  allowMultipleProfiles() {
    return 'test';
  }

  @Get('no-profile')
  @Security.CheckIpBlackList()
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
      const requestIPAddress = ['192.168.2.1', '192.168.2.2', '192.168.2.3'];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/single')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.OK);
      }
    });

    it('should return true when a request comes in with multiple profiles applied and from an allowed IP address.', async () => {
      const requestIPAddress = ['192.168.2.1', '192.168.2.2', '192.168.2.3'];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.OK);
      }
    });

    it('should return false when a request comes in with a single profile applied and not from an IP address.', async () => {
      const requestIPAddress = [...new NaiveBlackListProfile().getIpBlackList()];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/single')
          .set('X-Forwarded-For', ip)
          .expect({
            statusCode: HttpStatus.FORBIDDEN,
            message: `Forbidden IP address: ${ip}, profile name: NaiveBlackListProfile`,
          });
      }
    });

    it('should return false when a request comes in with a multiple profile applied and not from an IP address.', async () => {
      const envProfile = app.get(EnvBlackListProfile);
      const requestIPAddress = [
        ...new NaiveBlackListProfile().getIpBlackList(),
        ...envProfile.getIpBlackList(),
      ];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect({
            statusCode: HttpStatus.FORBIDDEN,
            message: `Forbidden IP address: ${ip}, profile name: NaiveBlackListProfile, EnvBlackListProfile`,
          });
      }
    });
  });
});
