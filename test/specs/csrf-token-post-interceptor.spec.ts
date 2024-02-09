import { Controller, ExecutionContext, Injectable, Post, UseInterceptors } from '@nestjs/common';
import { APP_GUARD, NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AllowProfiles, CSRFTokenPostInterceptor, CSRF_TOKEN_HEADER, Security } from '../../src';
import {
  AppModule,
  EnvBlackListProfile,
  EnvWhiteListProfile,
  HmacCSRFTokenProfile,
} from '../fixtures';
import * as request from 'supertest';

/**
 * response csrf token header name
 * - test code check this header name is exist and length is greater than 10
 */
const TEST_HEADER_NAME = 'x-text';

/**
 * TestInterceptor
 * - add csrf token to response header
 */
@Injectable()
class TestInterceptor extends CSRFTokenPostInterceptor {
  override addTokenToResponse(context: any, token: string): void {
    const response = context.switchToHttp().getResponse();
    response.setHeader(TEST_HEADER_NAME, token);
  }
}

/**
 * TestReqUserGuard
 * - add user to request (req.user = { id })
 * - this guard is mock passport user guard
 */
@Injectable()
class TestReqUserGuard {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 12345,
    };

    return true;
  }
}

@Controller()
export class TestController {
  @Post('no-profile')
  @UseInterceptors(TestInterceptor)
  noProfile() {
    return 'test';
  }

  @Post('multiple')
  @AllowProfiles(EnvBlackListProfile, EnvWhiteListProfile)
  @UseInterceptors(TestInterceptor)
  allowMultipleProfiles() {
    return 'test';
  }

  @Post('not-allowed-profile')
  @Security.GenSignedCSRFToken(EnvBlackListProfile as any)
  notAllowedProfile() {
    return 'test';
  }

  @Post('allowed-profile')
  @Security.GenSignedCSRFToken(HmacCSRFTokenProfile)
  allowedProfile() {
    return 'test';
  }
}

describe('CSRFTokenPostInterceptor', () => {
  let app: NestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: TestReqUserGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('If 0 security profiles are registered, 500 errors must be returned.', () => {
    return request(app.getHttpServer()).post('/no-profile').expect({
      statusCode: 500,
      message: 'CSRFTokenPostInterceptor requires exactly one profile ',
      error: 'Internal Server Error',
    });
  });

  it('If more than one security profile is registered, an error must be returned.', () => {
    return request(app.getHttpServer()).post('/multiple').expect({
      statusCode: 500,
      message: 'CSRFTokenPostInterceptor requires exactly one profile ',
      error: 'Internal Server Error',
    });
  });

  it('If the registered security profile is not a CSRFToken Validation Scheme, an error must be returned.', () => {
    return request(app.getHttpServer()).post('/not-allowed-profile').expect({
      statusCode: 500,
      message:
        'Not allowed profile(EnvBlackListProfile). CSRFTokenPostInterceptor requires only CSRFTokenValidationSchema',
      error: 'Internal Server Error',
    });
  });

  it('must create a CSRF token using a security profile and include the generated token in the specified response.', async () => {
    const response = await request(app.getHttpServer()).post('/allowed-profile').expect(201);
    const csrfToken = response.header[CSRF_TOKEN_HEADER];

    expect(csrfToken).toBeDefined();
    expect(csrfToken.length).toBeGreaterThan(10);
  });
});
