import { IpBlackListMiddleware } from '../../src';
import { Test } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppModule, NaiveBlackListProfile, EnvBlackListProfile } from '../fixtures';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';

@Controller('test')
class SingleProfileContorller {
  @Get()
  test() {
    return true;
  }
}

@Controller('test')
class MultipleProfileController {
  @Get()
  test() {
    return true;
  }
}

@Controller('test')
class NoProfileController {
  @Get()
  test() {
    return true;
  }
}

const successHttpStatus = HttpStatus.OK;
const failHttpStatus = HttpStatus.FORBIDDEN;

const testCases = [
  // No profile, allow all IP addresses.
  {
    controller: NoProfileController,
    profileList: [],
    requestIPs: ['127.0.0.1'],
    expectedStatus: successHttpStatus,
  },
  // Single profile, accept all-pass ip addresses.
  {
    controller: SingleProfileContorller,
    profileList: [NaiveBlackListProfile],
    requestIPs: ['192.168.2.1', '192.168.2.2', '192.168.2.3'],
    expectedStatus: successHttpStatus,
  },
  // Multiple profiles, accept all-pass ip addresses.
  {
    controller: MultipleProfileController,
    profileList: [NaiveBlackListProfile, EnvBlackListProfile],
    requestIPs: ['192.168.2.1', '192.168.2.2', '192.168.2.3'],
    expectedStatus: successHttpStatus,
  },
  // Single profile, deny ip addresses in the profile.
  {
    controller: SingleProfileContorller,
    profileList: [NaiveBlackListProfile],
    requestIPs: [...new NaiveBlackListProfile().getIpBlackList()],
    expectedStatus: failHttpStatus,
  },
  // Multiple profiles, deny ip addresses in the profile.
  {
    controller: MultipleProfileController,
    profileList: [NaiveBlackListProfile, EnvBlackListProfile],
    requestIPs: [...new NaiveBlackListProfile().getIpBlackList(), '172.16.0.0'],
    expectedStatus: failHttpStatus,
  },
];

describe.each(testCases)(
  'should return $expectedStatus in $controller.name if requestIP is $requestIPs',
  ({ controller, profileList, requestIPs, expectedStatus }) => {
    let app: NestApplication;

    @Module({
      imports: [],
      controllers: [controller],
      providers: [],
    })
    class TestModule {
      configure(consumer: MiddlewareConsumer) {
        consumer.apply(IpBlackListMiddleware.allowProfiles(...profileList)).forRoutes(controller);
      }
    }

    beforeAll(async () => {
      const module = await Test.createTestingModule({
        imports: [AppModule, TestModule, ConfigModule],
      }).compile();

      app = module.createNestApplication();
      await app.init();
    });

    it('use', async () => {
      for await (const ip of requestIPs) {
        await request(app.getHttpServer())
          .get('/test')
          // set X-Forwarded-For header to test IP address in request.
          .set('X-Forwarded-For', ip)
          .expect(expectedStatus);
      }
    });
  },
);
