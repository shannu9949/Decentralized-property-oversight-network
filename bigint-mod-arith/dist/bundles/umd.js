!function(n,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((n="undefined"!=typeof globalThis?globalThis:n||self).bigintModArith={})}(this,(function(n){"use strict";function e(n){return n>=0?n:-n}function t(n,e){if("number"==typeof n&&(n=BigInt(n)),"number"==typeof e&&(e=BigInt(e)),n<=0n||e<=0n)throw new RangeError("a and b MUST be > 0");let t=0n,r=1n,o=1n,i=0n;for(;0n!==n;){const f=e/n,u=e%n,g=t-o*f,b=r-i*f;e=n,n=u,t=o,r=i,o=g,i=b}return{g:e,x:t,y:r}}function r(n,t){let r="number"==typeof n?BigInt(e(n)):e(n),o="number"==typeof t?BigInt(e(t)):e(t);if(0n===r)return o;if(0n===o)return r;let i=0n;for(;0n===(1n&(r|o));)r>>=1n,o>>=1n,i++;for(;0n===(1n&r);)r>>=1n;do{for(;0n===(1n&o);)o>>=1n;if(r>o){const n=r;r=o,o=n}o-=r}while(0n!==o);return r<<i}function o(n,e){if("number"==typeof n&&(n=BigInt(n)),"number"==typeof e&&(e=BigInt(e)),e<=0n)throw new RangeError("n must be > 0");const t=n%e;return t<0n?t+e:t}function i(n,e){const r=t(o(n,e),e);if(1n!==r.g)throw new RangeError(`${n.toString()} does not have inverse modulo ${e.toString()}`);return o(r.x,e)}n.abs=e,n.bitLength=function(n){if("number"==typeof n&&(n=BigInt(n)),1n===n)return 1;let e=1;do{e++}while((n>>=1n)>1n);return e},n.eGcd=t,n.gcd=r,n.lcm=function(n,t){return"number"==typeof n&&(n=BigInt(n)),"number"==typeof t&&(t=BigInt(t)),0n===n&&0n===t?BigInt(0):e(n/r(n,t)*t)},n.max=function(n,e){return n>=e?n:e},n.min=function(n,e){return n>=e?e:n},n.modInv=i,n.modPow=function n(t,r,f){if("number"==typeof t&&(t=BigInt(t)),"number"==typeof r&&(r=BigInt(r)),"number"==typeof f&&(f=BigInt(f)),f<=0n)throw new RangeError("n must be > 0");if(1n===f)return 0n;if(t=o(t,f),r<0n)return i(n(t,e(r),f),f);let u=1n;for(;r>0;)r%2n===1n&&(u=u*t%f),r/=2n,t=t**2n%f;return u},n.toZn=o,Object.defineProperty(n,"__esModule",{value:!0})}));
