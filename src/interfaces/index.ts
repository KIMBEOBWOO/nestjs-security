import { getClientIp } from '@supercharge/request-ip';

export interface SecurityProfile {
  /**
   * validate current context base on security profiles
   */
  validate(...param: any[]): Promise<boolean>;
}

export interface IpWhiteListValidationSchema {
  /**
   * return allow IP address list
   */
  getIpWhiteList(): string[] | Promise<string[]>;
}

export interface IpBlackListValidationSchema {
  /**
   * return reject IP address list
   */
  getIpBlackList(): string[] | Promise<string[]>;
}

export abstract class IpWhiteListValidationSecurityProfile
  implements SecurityProfile, IpWhiteListValidationSchema
{
  async validate(request: Request) {
    const currentIP = getClientIp(request);
    const ipWhiteList = await this.getIpWhiteList();

    // If there is no ipWhiteList, not allow all IP addresses.
    if (!currentIP || !ipWhiteList.includes(currentIP)) {
      return false;
    }

    return true;
  }

  abstract getIpWhiteList(): string[] | Promise<string[]>;
}

export abstract class IpBlackListValidationSecurityProfile
  implements SecurityProfile, IpBlackListValidationSchema
{
  async validate(request: Request) {
    const currentIP = getClientIp(request);
    const ipBlackList = await this.getIpBlackList();

    if (!currentIP || ipBlackList.includes(currentIP)) {
      return false;
    }

    return true;
  }

  abstract getIpBlackList(): string[] | Promise<string[]>;
}

// 동일한 프로필 인스턴스끼리는 집합 조건을 부여하자
// ex) whitelist 1, whitelist 2 -> at least one 조건
// ex) blacklist 1, blacklist 2 -> all 조건
// ex) csrf 1, csrf 2 -> 이건 좀 애매.. 둘 다 통과 ..? 커스텀 가능 하게 만들자

// 커스텀이 가능한가..?
// 결국 해당 조건을 적용하는곳은 가드나 미들웨어 등 엔드포인트 검증하는곳
// 상관없긴할듯. 동일 프로필 인스턴스이면서 다른 집합 조건을 가진 경우 우선순위가 필요할듯
// ex) 모든 검사가 통과해야 성공인 집합 조건이 최우선 위의 3번 예시에서는 커스텀이 된다해도 무조건
// csrf 2 번이 all 조건이기 때문에 csrf 1, csrf 2가 통과해야 통과됨

/**
 * 각 보안 엔드 포인트에서 해야하는일
 *
 * 1. 해당 엔드 포인트의 연산을 확인
 * 2. 각 프로필의 실행 결과 수집
 * 3. 프로필 실행 결과를 연산에 따라 계산 후 최종 결과 반환
 */

// white, white, black, white -> at least one, must ->
// at least, kind 1 -> white1, white2, white3,
// at least, kind 2 -> csrf token 1, csrf token 2
// all -> black list, black list
