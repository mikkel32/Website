import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

global.crypto = webcrypto;
