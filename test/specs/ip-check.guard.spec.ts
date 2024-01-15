import { BaseSecurityProfile, SecurityModule, Security } from '../../src';
import { Test } from '@nestjs/testing';
import { DiscoveryModule, DiscoveryService, NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus, Type } from '@nestjs/common';
import { TestSecurityProfile, TestSecurityProfile2 } from '../fixtures';
import * as request from 'supertest';

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
  let discoveryService: DiscoveryService;

  beforeAll(async () => {
    const profileList: Type<BaseSecurityProfile>[] = [TestSecurityProfile, TestSecurityProfile2];
    const module = await Test.createTestingModule({
      imports: [
        DiscoveryModule,
        SecurityModule.forRoot({
          profiles: profileList,
        }),
      ],
      controllers: [TestController1],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    discoveryService = module.get(DiscoveryService);
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
          .expect(HttpStatus.OK)
          .expect('test');
      }
    });

    it('should return true when a request comes in with multiple profiles applied and from an allowed IP address.', async () => {
      const requestIPAddress = [
        ...new TestSecurityProfile().getIPWhiteList(),
        ...new TestSecurityProfile2().getIPWhiteList(),
      ];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.OK)
          .expect('test');
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
      const requestIPAddress = [
        ...new TestSecurityProfile().getIPWhiteList().map((ip) => `${ip}1`),
        ...new TestSecurityProfile2().getIPWhiteList().map((ip) => `${ip}1`),
      ];

      for await (const ip of requestIPAddress) {
        await request(app.getHttpServer())
          .get('/test1/multiple')
          .set('X-Forwarded-For', ip)
          .expect(HttpStatus.FORBIDDEN);
      }
    });
  });

  describe('constructor', () => {
    it('All security profiles must be taken and initialized to an instance variable in the form of a Map.', async () => {
      const ipGuards = discoveryService
        .getProviders()
        .find((provider) => provider.name === 'IPCheckGuard')?.instance;
      const securityProfiles = ipGuards.profiles;

      expect(securityProfiles.length).toBe(2);
      for (const profile of securityProfiles) {
        expect(profile).toBeInstanceOf(BaseSecurityProfile);
      }
    });
  });
});
