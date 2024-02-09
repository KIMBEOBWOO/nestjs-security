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
import { AppModule, JwtCSRFTokenProfile, SessionCSRFTokenProfile } from '../fixtures';
import * as request from 'supertest';
import { sign } from 'jsonwebtoken';

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
  @Security.CheckSignedCSRFToken(JwtCSRFTokenProfile)
  validProfile() {
    return true;
  }

  @Post('valid/one-of-profiles')
  @Security.CheckSignedCSRFToken(JwtCSRFTokenProfile, SessionCSRFTokenProfile)
  validOneOfProfiles() {
    return true;
  }

  @Post('invalid/single-profile')
  @Security.CheckSignedCSRFToken(JwtCSRFTokenProfile)
  invalidProfile() {
    return true;
  }

  @Post('invalid/all-profiles')
  @Security.CheckSignedCSRFToken(JwtCSRFTokenProfile, SessionCSRFTokenProfile)
  invalidAllProfiles() {
    return true;
  }
}

const signedCSRFTokenProfile = new JwtCSRFTokenProfile();

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

  describe('Profile behavior', () => {
    it('should return true when a request comes in without a decorator applied.', () => {
      return request(app.getHttpServer()).post('/no-decorator').expect(HttpStatus.CREATED);
    });

    it('should return true when a request comes in without a security profile applied.', () => {
      return request(app.getHttpServer()).post('/no-profile').expect(HttpStatus.CREATED);
    });

    it('should return true if a request comes in with a single profile applied and contain valid CSRF Token', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: '1234',
      });
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      await request(app.getHttpServer())
        .post('/valid/single-profile')
        .set('Authorization', accessToken)
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.CREATED);
    });

    it('should return true if a request comes in with a multiple profile applied and pass through one of profiles', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: '1234',
      });
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      await request(app.getHttpServer())
        .post('/valid/one-of-profiles')
        .set('Authorization', accessToken)
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.CREATED);
    });

    it('should return false if a request comes in with a single profile applied and contain invalid CSRF Token', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: '1234',
      });
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      await request(app.getHttpServer())
        .post('/invalid/single-profile')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return false if a request comes in with a multiple profile applied and falied all profiles', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: '12345',
      });
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      await request(app.getHttpServer())
        .post('/invalid/all-profiles')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('CSRF Token integrity', () => {
    it('if session id is changed, the CSRF token must be invalid', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: testSessionId + 111,
      });
      /**
       * Generate CSRF token with original session id
       * - current request session id is 'test-session-id', but the CSRF token is generated with 'test-session-id-original'
       */
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      await request(app.getHttpServer())
        .post('/invalid/single-profile')
        .set(CSRF_TOKEN_HEADER, csrfToken)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('if the CSRF token is forgerys, the CSRF token must be invalid', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: testSessionId + 111,
      });
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      // change one character of the CSRF token
      const forgeryCsrfToken = csrfToken.slice(0, -1) + 'A';

      await request(app.getHttpServer())
        .post('/invalid/single-profile')
        .set('Authorization', accessToken)
        .set(CSRF_TOKEN_HEADER, forgeryCsrfToken)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('if the CSRF token Message is forgerys, the CSRF token must be invalid', async () => {
      const accessToken = sign({ id: 12345 }, 'secret', {
        jwtid: testSessionId,
      });
      const csrfToken = await signedCSRFTokenProfile.generateCSRFToken({
        accessToken,
      });

      // change one character of the CSRF token message
      const forgeryCsrfToken =
        csrfToken.slice(0, csrfToken.indexOf('.')) +
        '.' +
        csrfToken.slice(csrfToken.indexOf('.') + 2);

      await request(app.getHttpServer())
        .post('/invalid/single-profile')
        .set('Authorization', accessToken)
        .set(CSRF_TOKEN_HEADER, forgeryCsrfToken)
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
