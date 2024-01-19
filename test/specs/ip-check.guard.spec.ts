import { Security } from '../../src';
import { Test } from '@nestjs/testing';
import { DiscoveryModule, NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus, Type } from '@nestjs/common';
import { AppModule, TestSecurityProfile, TestSecurityProfile2 } from '../fixtures';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from '../../src/security.module';

@Controller('test1')
class TestController1 {
  @Get('single')
  @Security.AllowProfiles(TestSecurityProfile)
  allowSingleProfile() {
    return 'test';
  }

  @Get('multiple')
  @Security.AllowProfiles(TestSecurityProfile, TestSecurityProfile2)
  allowMultipleProfiles() {
    return 'test';
  }

  @Get('no-profile')
  @Security.AllowProfiles()
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
    const profileList: Type<unknown>[] = [TestSecurityProfile, TestSecurityProfile2];
    const module = await Test.createTestingModule({
      imports: [AppModule, DiscoveryModule, ConfigModule, SecurityModule.forRoot()],
      controllers: [TestController1],
      providers: [...profileList],
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
      const requestIPAddress = new TestSecurityProfile().getIPWhiteList();

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
      const requestIPAddress = new TestSecurityProfile().getIPWhiteList().map((ip) => `${ip}1`);

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/single')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.FORBIDDEN);
      }
    });

    it('should return false when a request comes in with a multiple profile applied and not from an IP address.', async () => {
      const requestIPAddress = ['127.0.0.3'];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.FORBIDDEN);
      }
    });
  });
});
