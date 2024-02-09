import { Injectable, ExecutionContext, Controller, UseGuards, Get } from '@nestjs/common';
import { CSRF_TOKEN_HEADER, Security } from '../../src';
import { AppModule, HmacCSRFTokenProfile } from '../fixtures';
import * as request from 'supertest';
import * as crypto from 'crypto';
import { NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';

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
class TestController {
  @Security.GenSignedCSRFToken(HmacCSRFTokenProfile)
  @UseGuards(TestReqUserGuard)
  @Get('signed-csrf-token')
  generateSignedCSRFToken() {
    return true;
  }
}

/**
 * Since the basic interceptor behavior was covered
 * in the test code of the CSRFTokenPostInterceptor(csrf-token-post-interceptor.spec.ts),
 * we focus only on the csrf token included in the response
 * after applying the AddCsrfTokenToResponseHeaderInterceptor.
 */
describe('@Security.GenSignedCSRFToken', () => {
  let app: NestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('The generated CSRF token must have the format {hmac}.{message}.', async () => {
    // when
    const response = await request(app.getHttpServer()).get('/signed-csrf-token');
    const csrfToken = response.header[CSRF_TOKEN_HEADER];

    // then
    const [hmac, message] = csrfToken.split('.');
    expect(hmac).toBeDefined();
    expect(message).toBeDefined();
  });

  it('The generated CSRF token "message" must have the format {sessionId}!{timestamp}!{nonce}.', async () => {
    // mock Date.now()
    const testTimestamp = 1234567890;
    jest.spyOn(Date, 'now').mockReturnValueOnce(testTimestamp);

    // when
    const response = await request(app.getHttpServer()).get('/signed-csrf-token');
    const csrfToken = response.header[CSRF_TOKEN_HEADER];

    // then
    const [, message] = csrfToken.split('.');
    const [sessionId, timestamp, nonce] = message.split('!');

    expect(sessionId).toBe(testSessionId);
    expect(timestamp).toBe(testTimestamp.toString());
    expect(nonce.length).not.toBeLessThan(10);
  });

  it('The generated CSRF token must be encrypted with HMAC-SHA256.', async () => {
    // when
    const response = await request(app.getHttpServer()).get('/signed-csrf-token');
    const csrfToken = response.header[CSRF_TOKEN_HEADER];
    const [hmac, message] = csrfToken.split('.');

    // then
    // validate hmac with secretKey and message (sessionId!timestamp!nonce)
    const secretKey = 'secretKey';
    const expectedHmac = crypto.createHmac('sha256', secretKey).update(message).digest('hex');
    expect(hmac).toBe(expectedHmac);
  });
});
