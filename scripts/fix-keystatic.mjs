import { readFileSync, writeFileSync } from 'fs';

const files = [
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.js',
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.js',
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.react-server.js',
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.react-server.js',
  'node_modules/@keystatic/core/dist/keystatic-core-api-generic.worker.js',
];

let patched = 0;
for (const file of files) {
  let c = readFileSync(file, 'utf8');
  if (c.includes('expiresIn = tokenData.expires_in ?? 86400')) {
    console.log(`Already patched: ${file}`); continue;
  }
  c = c.replace(/expires_in: s\.number\(\)/g, 'expires_in: s.optional(s.number())');
  c = c.replace(/refresh_token: s\.string\(\)/g, 'refresh_token: s.optional(s.string())');
  c = c.replace(/refresh_token_expires_in: s\.number\(\)/g, 'refresh_token_expires_in: s.optional(s.number())');
  c = c.replace(/scope: s\.string\(\)/g, 'scope: s.optional(s.string())');
  c = c.replace(/token_type: s\.literal\('bearer'\)/g, "token_type: s.optional(s.literal('bearer'))");
  c = c.replace(
    /const headers = \[\['Set-Cookie', cookie\.serialize\('keystatic-gh-access-token', tokenData\.access_token, \{/,
    `const expiresIn = tokenData.expires_in ?? 86400;\n  const refreshExpiresIn = tokenData.refresh_token_expires_in ?? 7776000;\n  const refreshToken = tokenData.refresh_token ?? tokenData.access_token;\n  const headers = [['Set-Cookie', cookie.serialize('keystatic-gh-access-token', tokenData.access_token, {`
  );
  c = c.replace(/maxAge: tokenData\.expires_in,/g, 'maxAge: expiresIn,');
  c = c.replace(/expires: new Date\(Date\.now\(\) \+ tokenData\.expires_in \* 1000\)/g, 'expires: new Date(Date.now() + expiresIn * 1000)');
  c = c.replace(/await encryptValue\(tokenData\.refresh_token,/g, 'await encryptValue(refreshToken,');
  c = c.replace(/maxAge: tokenData\.refresh_token_expires_in,/g, 'maxAge: refreshExpiresIn,');
  c = c.replace(/expires: new Date\(Date\.now\(\) \+ tokenData\.refresh_token_expires_in \* 100\)/g, 'expires: new Date(Date.now() + refreshExpiresIn * 1000)');
  c = c.replace(/if \(!tokenRes\.ok\) \{\s*return;\s*\}/g, 'if (!tokenRes.ok) {\n    return getTokenCookies({ access_token: refreshToken }, config);\n  }');
  c = c.replace(/url\.searchParams\.set\('redirect_uri'/, "url.searchParams.set('scope', 'repo');\n  url.searchParams.set('redirect_uri'");
  writeFileSync(file, c);
  patched++;
  console.log(`Patched: ${file}`);
}
console.log(`Done. ${patched} file(s) patched.`);
