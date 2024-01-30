import { IpWhiteListMiddleware } from '../../src';
import { Test } from '@nestjs/testing';
import { NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus, MiddlewareConsumer, Module } from '@nestjs/common';
import {
  AppModule,
  NaiveWhiteListProfile,
  EnvWhiteListProfile,
  CIDRWhiteListProfile,
} from '../fixtures';
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

@Controller('test')
class CIDRController {
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
  // Single profile, allow only IP addresses in the profile.
  {
    controller: SingleProfileContorller,
    profileList: [NaiveWhiteListProfile],
    requestIPs: ['127.0.0.1', '192.168.0.1', '192.168.0.2'],
    expectedStatus: successHttpStatus,
  },
  // Multiple profiles, allow only IP addresses in the profiles.
  {
    controller: MultipleProfileController,
    profileList: [NaiveWhiteListProfile, EnvWhiteListProfile],
    requestIPs: ['127.0.0.1', '192.168.0.1', '192.168.0.2', '172.16.0.0'],
    expectedStatus: successHttpStatus,
  },
  // Single profile, not allow IP addresses not in the profile.
  {
    controller: SingleProfileContorller,
    profileList: [NaiveWhiteListProfile],
    requestIPs: ['172.217.168.142'],
    expectedStatus: failHttpStatus,
  },
  // Multiple profiles, not allow IP addresses not in the profiles.
  {
    controller: MultipleProfileController,
    profileList: [NaiveWhiteListProfile, EnvWhiteListProfile],
    requestIPs: ['172.217.168.142'],
    expectedStatus: failHttpStatus,
  },
  // CIDR profile, deny ip addresses not in the profile.
  {
    controller: CIDRController,
    profileList: [CIDRWhiteListProfile],
    requestIPs: ['192.168.0.5', '192.168.16.0', '192.168.31.255'],
    expectedStatus: successHttpStatus,
  },
  // CIDR profile, allow ip addresses in the profile.
  {
    controller: CIDRController,
    profileList: [CIDRWhiteListProfile],
    requestIPs: ['192.168.0.4', '192.168.0.6', '192.168.32.0', '192.168.15.255'],
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
        consumer.apply(IpWhiteListMiddleware.allowProfiles(...profileList)).forRoutes(controller);
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
