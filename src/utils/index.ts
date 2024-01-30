/**
 * regex for matching IPv4 CIDR expression.
 */
const ipV4Matcher = /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;

/**
 * validate given string is CIDR expression
 * @param str validate target string
 * @returns true if str is IPv4 CIDR expression, otherwise false.
 */
export const isIpV4 = (str: string) => ipV4Matcher.test(str);
