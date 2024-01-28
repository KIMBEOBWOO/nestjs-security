import { HttpException, HttpStatus } from '@nestjs/common';

export class SecurityModuleError extends HttpException {}

export class InvalidProfileOperatorError extends SecurityModuleError {
  constructor(operator: string) {
    super(`Invalid profile operator: ${operator}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class DuplicatedProfileNameError extends SecurityModuleError {
  constructor(profileName: string) {
    super(`Duplicated security profile name: ${profileName}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class NotExistProfileError extends SecurityModuleError {
  constructor(profileName: string) {
    super(`Not Exist profile name: ${profileName}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ForbiddenIpAddressError extends SecurityModuleError {
  constructor(profileName: string, ipAddress: string) {
    super(`Forbidden IP address: ${ipAddress}, profile name: ${profileName}`, HttpStatus.FORBIDDEN);
  }
}

export class MissingIpAddressInRequestError extends SecurityModuleError {
  constructor() {
    super(`Missing IP address in request`, HttpStatus.FORBIDDEN);
  }
}
