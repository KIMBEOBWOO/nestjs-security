import { IPCheckMiddleware } from '../../src';
import { Test } from '@nestjs/testing';
import { DiscoveryModule, NestApplication } from '@nestjs/core';
import { Controller, Get, HttpStatus, MiddlewareConsumer, Module } from '@nestjs/common';
import { AppModule, TestSecurityProfile, TestSecurityProfile2 } from '../fixtures';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { SecurityModule } from '../../src/security.module';

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
  // Single profile, allow only IP addresses in the profile.
  {
    controller: SingleProfileContorller,
    profileList: [TestSecurityProfile],
    requestIPs: [...new TestSecurityProfile().getIpWhiteList()],
    expectedStatus: successHttpStatus,
  },
  // Multiple profiles, allow only IP addresses in the profiles.
  {
    controller: MultipleProfileController,
    profileList: [TestSecurityProfile, TestSecurityProfile2],
    requestIPs: [...new TestSecurityProfile().getIpWhiteList(), '172.16.0.0'],
    expectedStatus: successHttpStatus,
  },
  // Single profile, not allow IP addresses not in the profile.
  {
    controller: SingleProfileContorller,
    profileList: [TestSecurityProfile],
    requestIPs: ['172.217.168.142'],
    expectedStatus: failHttpStatus,
  },
  // Multiple profiles, not allow IP addresses not in the profiles.
  {
    controller: MultipleProfileController,
    profileList: [TestSecurityProfile, TestSecurityProfile2],
    requestIPs: ['172.217.168.142'],
    expectedStatus: failHttpStatus,
  },
];

describe.each(testCases)(
  'should return $expectedStatus in $controller.name if requestIP is $requestIPs',
  ({ controller, profileList, requestIPs, expectedStatus }) => {
    let app: NestApplication;

    @Module({
      imports: [DiscoveryModule, SecurityModule.forRoot()],
      controllers: [controller],
      providers: [],
    })
    class TestModule {
      configure(consumer: MiddlewareConsumer) {
        consumer.apply(IPCheckMiddleware.allowProfiles(...profileList)).forRoutes(controller);
      }
    }

    beforeAll(async () => {
      const module = await Test.createTestingModule({
        imports: [AppModule, TestModule, DiscoveryModule, ConfigModule],
        providers: [...profileList],
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
