export function md5(str) {
  function rotateLeft(n, s) {
    return (n << s) | (n >>> (32 - s));
  }
  const cmn = (q, a, b, x, s, t) => {
    a = (((a + q) + (x + t)) & 0xFFFFFFFF);
    return (a = rotateLeft(a, s)) + b;
  };
  const ff = (a, b, c, d, x, s, t) => cmn((b & c) | (~b & d), a, b, x, s, t);
  const gg = (a, b, c, d, x, s, t) => cmn((b & d) | (c & ~d), a, b, x, s, t);
  const hh = (a, b, c, d, x, s, t) => cmn(b ^ c ^ d, a, b, x, s, t);
  const ii = (a, b, c, d, x, s, t) => cmn(c ^ (b | ~d), a, b, x, s, t);

  let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
  const x = new Array(16);
  const strBytes = new TextEncoder().encode(str);
  const len = strBytes.length;
  const paddedLen = ((len + 8) & ~63) + 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(strBytes);
  padded[len] = 0x80;
  for (let i = len + 1; i < paddedLen - 8; i++) padded[i] = 0;
  for (let i = 0; i < 8; i++) padded[paddedLen - 8 + i] = (len * 8 >> (i * 8)) & 0xFF;

  for (let i = 0; i < paddedLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      x[j] = padded[i + j * 4] | (padded[i + j * 4 + 1] << 8) |
             (padded[i + j * 4 + 2] << 16) | (padded[i + j * 4 + 3] << 24);
    }
    let aa = a, bb = b, cc = c, dd = d;
    a = ff(a, b, c, d, x[0], 7, 0xD76AA478);
    d = ff(d, a, b, c, x[1], 12, 0xE8C7B756);
    c = ff(c, d, a, b, x[2], 17, 0x242070DB);
    b = ff(b, c, d, a, x[3], 22, 0xC1BDCEEE);
    a = ff(a, b, c, d, x[4], 7, 0xF57C0FAF);
    d = ff(d, a, b, c, x[5], 12, 0x4787C62A);
    c = ff(c, d, a, b, x[6], 17, 0xA8304613);
    b = ff(b, c, d, a, x[7], 22, 0xFD469501);
    a = ff(a, b, c, d, x[8], 7, 0x698098D8);
    d = ff(d, a, b, c, x[9], 12, 0x8B44F7AF);
    c = ff(c, d, a, b, x[10], 17, 0xFFFF5BB1);
    b = ff(b, c, d, a, x[11], 22, 0x895CD7BE);
    a = ff(a, b, c, d, x[12], 7, 0x6B901122);
    d = ff(d, a, b, c, x[13], 12, 0xFD987193);
    c = ff(c, d, a, b, x[14], 17, 0xA679438E);
    b = ff(b, c, d, a, x[15], 22, 0x49B40821);
    a = gg(a, b, c, d, x[1], 5, 0xF61E2562);
    d = gg(d, a, b, c, x[6], 9, 0xC040B340);
    c = gg(c, d, a, b, x[11], 14, 0x265E5A51);
    b = gg(b, c, d, a, x[0], 20, 0xE9B6C7AA);
    a = gg(a, b, c, d, x[5], 5, 0xD62F105D);
    d = gg(d, a, b, c, x[10], 9, 0x02441453);
    c = gg(c, d, a, b, x[15], 14, 0xD8A1E681);
    b = gg(b, c, d, a, x[4], 20, 0xE7D3FBC8);
    a = gg(a, b, c, d, x[9], 5, 0x21E1CDE6);
    d = gg(d, a, b, c, x[14], 9, 0xC33707D6);
    c = gg(c, d, a, b, x[3], 14, 0xF4D50D87);
    b = gg(b, c, d, a, x[8], 20, 0x455A14ED);
    a = gg(a, b, c, d, x[13], 5, 0xA9E3E905);
    d = gg(d, a, b, c, x[2], 9, 0xFCEFA3F8);
    c = gg(c, d, a, b, x[7], 14, 0x676F02D9);
    b = gg(b, c, d, a, x[12], 20, 0x8D2A4C8A);
    a = hh(a, b, c, d, x[5], 4, 0xFFFA3942);
    d = hh(d, a, b, c, x[8], 11, 0x8771F681);
    c = hh(c, d, a, b, x[11], 16, 0x6D9D6122);
    b = hh(b, c, d, a, x[14], 23, 0xFDE5380C);
    a = hh(a, b, c, d, x[1], 4, 0xA4BEEA44);
    d = hh(d, a, b, c, x[4], 11, 0x4BDECFA9);
    c = hh(c, d, a, b, x[7], 16, 0xF6BB4B60);
    b = hh(b, c, d, a, x[10], 23, 0xBEBFBC70);
    a = hh(a, b, c, d, x[13], 4, 0x289B7EC6);
    d = hh(d, a, b, c, x[0], 11, 0xEAA127FA);
    c = hh(c, d, a, b, x[3], 16, 0xD4EF3085);
    b = hh(b, c, d, a, x[6], 23, 0x04881D05);
    a = hh(a, b, c, d, x[9], 4, 0xD9D4D039);
    d = hh(d, a, b, c, x[12], 11, 0xE6DB99E5);
    c = hh(c, d, a, b, x[15], 16, 0x1FA27CF8);
    b = hh(b, c, d, a, x[2], 23, 0xC4AC5665);
    a = ii(a, b, c, d, x[0], 6, 0xF4292244);
    d = ii(d, a, b, c, x[7], 10, 0x432AFF97);
    c = ii(c, d, a, b, x[14], 15, 0xAB9423A7);
    b = ii(b, c, d, a, x[5], 21, 0xFC93A039);
    a = ii(a, b, c, d, x[12], 6, 0x655B59C3);
    d = ii(d, a, b, c, x[3], 10, 0x8F0CCC92);
    c = ii(c, d, a, b, x[10], 15, 0xFFEFF47D);
    b = ii(b, c, d, a, x[1], 21, 0x85845DD1);
    a = ii(a, b, c, d, x[8], 6, 0x6FA87E4F);
    d = ii(d, a, b, c, x[15], 10, 0xFE2CE6E0);
    c = ii(c, d, a, b, x[6], 15, 0xA3014314);
    b = ii(b, c, d, a, x[13], 21, 0x4E0811A1);
    a = ii(a, b, c, d, x[4], 6, 0xF7537E82);
    d = ii(d, a, b, c, x[11], 10, 0xBD3AF235);
    c = ii(c, d, a, b, x[2], 15, 0x2AD7D2BB);
    b = ii(b, c, d, a, x[9], 21, 0xEB86D391);
    a = (a + aa) & 0xFFFFFFFF;
    b = (b + bb) & 0xFFFFFFFF;
    c = (c + cc) & 0xFFFFFFFF;
    d = (d + dd) & 0xFFFFFFFF;
  }
  const toHex = n => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return [a, b, c, d].map(n => {
    return toHex(n & 0xFF) + toHex((n >> 8) & 0xFF) +
           toHex((n >> 16) & 0xFF) + toHex((n >> 24) & 0xFF);
  }).join('');
}
