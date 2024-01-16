import { SecurityModule } from '../../src';
import { Test } from '@nestjs/testing';
import { DiscoveryModule, DiscoveryService, NestApplication } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Type } from '@nestjs/common';
import { TestSecurityProfile, TestSecurityProfile2 } from '../fixtures';

describe('Security Module', () => {
  describe('forRoot', () => {
    let app: NestApplication;
    let discoveryService: DiscoveryService;
    const profileList: Type<unknown>[] = [TestSecurityProfile, TestSecurityProfile2];

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        imports: [DiscoveryModule, SecurityModule.forRoot()],
      }).compile();

      app = module.createNestApplication();

      await app.init();
      discoveryService = module.get(DiscoveryService);
    });

    it.skip('should register security profile providers', async () => {
      const providers = discoveryService.getProviders();
      const securityProfileProviders = providers.filter(
        (provider: InstanceWrapper) =>
          typeof provider.token === 'string' &&
          provider.token.startsWith('@nestj-security/profile'),
      );

      expect(securityProfileProviders.length).toBe(profileList.length);
      expect(
        securityProfileProviders.map((provider: InstanceWrapper) => provider.token),
      ).toStrictEqual(profileList.map((profile) => '@nestj-security/profile/' + profile.name));
    });

    it.skip('should register IPCheckGuard as global APP_GUARD', async () => {
      const providers = discoveryService.getProviders();
      const ipCheckGuardProvider = providers.find(
        (provider: InstanceWrapper) =>
          typeof provider.token === 'string' && provider.name === 'IPCheckGuard',
      );

      expect(ipCheckGuardProvider).toBeDefined();
    });
  });
});
