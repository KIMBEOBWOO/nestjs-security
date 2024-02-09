import {
  Controller,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { CSRF_TOKEN_HEADER, Security } from '../../src';
import { AppModule, HmacCSRFTokenProfile, HmacCSRFTokenProfile2 } from '../fixtures';
import * as request from 'supertest';

const testSessionId = 'test-session-id';

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
      id: testSessionId,
    };

    return true;
  }
}

@Controller()
@UseGuards(TestReqUserGuard)
class TestController {
  @Post('no-decorator')
  noAllowDecorators() {
    return 'test';
  }

  @Post('no-profile')
  @Security.CheckSignedCSRFToken()
  noProfile() {
    return 'test';
  }

  @Post('valid/single-profile')
  @Security.CheckSignedCSRFToken(HmacCSRFTokenProfile)
  validProfile() {
    return true;
  }

  @Post('valid/one-of-profiles')
  @Security.CheckSignedCSRFToken(HmacCSRFTokenProfile, HmacCSRFTokenProfile2)
  validOneOfProfiles() {
    return true;
  }

  @Post('invalid/single-profile')
  @Security.CheckSignedCSRFToken(HmacCSRFTokenProfile)
  invalidProfile() {
    return true;
  }

  @Post('invalid/all-profiles')
  @Security.CheckSignedCSRFToken(HmacCSRFTokenProfile, HmacCSRFTokenProfile2)
  invalidAllProfiles() {
    return true;
  }
}

const signedCSRFTokenProfile = new HmacCSRFTokenProfile();
const signedCSRFTokenProfile2 = new HmacCSRFTokenProfile2();

/**
 * This file is used to test the CheckSignedCSRFToken decorator
 * - The CheckSignedCSRFToken decorator is used to check the CSRF token in the request
 * - If the token is not valid, the request is rejected
 * - If the token is valid, the request is allowed
 */
describe('@Security.CheckSignedCSRFToken', () => {
  let app: NestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should return true when a request comes in without a decorator applied.', () => {
    return request(app.getHttpServer()).post('/no-decorator').expect(HttpStatus.CREATED);
  });

  it('should return true when a request comes in without a security profile applied.', () => {
    return request(app.getHttpServer()).post('/no-profile').expect(HttpStatus.CREATED);
  });

  it('should return true if a request comes in with a single profile applied and contain valid CSRF Token', async () => {
    const csrfTokens = [
      await signedCSRFTokenProfile.generateCSRFToken({
        user: {
          id: testSessionId,
        },
      } as any),
    ];

    for await (const csrfToken of csrfTokens) {
      await request(app.getHttpServer())
        .post('/valid/single-profile')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.CREATED);
    }
  });

  it('should return true if a request comes in with a multiple profile applied and pass through one of profiles', async () => {
    const csrfTokens = [
      await signedCSRFTokenProfile.generateCSRFToken({
        user: {
          id: testSessionId,
        },
      } as any),
      await signedCSRFTokenProfile2.generateCSRFToken({
        user: {
          id: testSessionId,
        },
      } as any),
    ];

    for await (const csrfToken of csrfTokens) {
      await request(app.getHttpServer())
        .post('/valid/one-of-profiles')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.CREATED);
    }
  });

  it('should return false if a request comes in with a single profile applied and contain invalid CSRF Token', async () => {
    const csrfTokens = [
      await signedCSRFTokenProfile.generateCSRFToken({
        user: {
          id: testSessionId + 'invalid',
        },
      } as any),
    ];

    for await (const csrfToken of csrfTokens) {
      await request(app.getHttpServer())
        .post('/invalid/single-profile')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.FORBIDDEN);
    }
  });

  it('should return false if a request comes in with a multiple profile applied and falied all profiles', async () => {
    const csrfTokens = [
      await signedCSRFTokenProfile.generateCSRFToken({
        user: {
          id: testSessionId + 'invalid',
        },
      } as any),
      await signedCSRFTokenProfile2.generateCSRFToken({
        user: {
          id: testSessionId + 'invalid',
        },
      } as any),
    ];

    for await (const csrfToken of csrfTokens) {
      await request(app.getHttpServer())
        .post('/invalid/all-profiles')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.FORBIDDEN);
    }
  });
});
