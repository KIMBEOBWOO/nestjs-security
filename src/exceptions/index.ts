export class SecurityModuleError extends Error {}

export class DuplicatedProfileNameError extends SecurityModuleError {
  constructor(name: string) {
    super(`Duplicated security profile name: ${name}`);
  }
}

export class NotExistProfileError extends SecurityModuleError {
  constructor(name: string) {
    super(`Not Exist profile: ${name}`);
  }
}
