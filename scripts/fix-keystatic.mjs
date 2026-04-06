import { readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';

const KEY_FILE = 'node_modules/@keystatic/core/dist/keystatic-core-api-generic.node.js';

// ── Guard: if core files are missing or syntactically broken, do a clean reinstall ──
if (!existsSync(KEY_FILE)) {
  console.log('⚠  @keystatic/core dist not found — reinstalling...');
  reinstallCore();
} else {
  const content = readFileSync(KEY_FILE, 'utf8');
  const doubleDecl = (content.match(/const expiresIn = /g) || []).length > 1;
  const syntaxOk = spawnSync(process.execPath, ['--check', KEY_FILE]).status === 0;
  if (doubleDecl || !syntaxOk) {
    console.log('⚠  Corrupted @keystatic/core detected (double-patch or syntax error). Reinstalling...');
    reinstallCore();
  }
}

function reinstallCore() {
  rmSync('node_modules/@keystatic/core', { recursive: true, force: true });
  const result = spawnSync(
    'npm', ['install', '--ignore-scripts'],
    { stdio: 'inherit', env: { ...process.env } }
  );
  if (result.status !== 0) {
    console.error('Failed to reinstall @keystatic/core');
    process.exit(1);
  }
  console.log('✓ Fresh @keystatic/core installed.');
}

// ── Now patch the (clean or already-correct) files ──
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
  let changed = false;

  // ── Patch A: make OAuth token fields optional + fix cookie durations ──
  const hasA = c.includes('const expiresIn = ');
  if (!hasA) {
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
    c = c.replace(/expires: new Date\(Date\.now\(\) \+ tokenData\.refresh_token_expires_in \* 1000\)/g, 'expires: new Date(Date.now() + refreshExpiresIn * 1000)');
    c = c.replace(/expires: new Date\(Date\.now\(\) \+ tokenData\.refresh_token_expires_in \* 100\)/g, 'expires: new Date(Date.now() + refreshExpiresIn * 1000)');
    c = c.replace(/if \(!tokenRes\.ok\) \{\s*return;\s*\}/g, 'if (!tokenRes.ok) {\n    return getTokenCookies({ access_token: refreshToken }, config);\n  }');
    c = c.replace(
      /url\.searchParams\.set\('redirect_uri'/,
      "url.searchParams.set('scope', 'repo');\n  url.searchParams.set('redirect_uri'"
    );
    changed = true;
  }

  // ── Patch B: fix OAuth redirect_uri on Vercel (use x-forwarded-host) ──
  const hasB = c.includes('_fwdHost');
  if (!hasB) {
    c = c.replace(
      /const reqUrl = new URL\(req\.url\);\n  const rawFrom/,
      `const reqUrl = new URL(req.url);\n  const _fwdHost = req.headers.get('x-forwarded-host');\n  const _fwdProto = req.headers.get('x-forwarded-proto') || reqUrl.protocol.replace(':', '');\n  const _origin = _fwdHost ? \`\${_fwdProto}://\${_fwdHost}\` : reqUrl.origin;\n  const rawFrom`
    );
    c = c.replace(
      /url\.searchParams\.set\('redirect_uri', `\$\{reqUrl\.origin\}\/api\/keystatic\/github\/oauth\/callback`\)/,
      "url.searchParams.set('redirect_uri', `${_origin}/api/keystatic/github/oauth/callback`)"
    );
    changed = true;
  }

  if (changed) {
    writeFileSync(file, c);
    // Verify syntax immediately after writing
    const check = spawnSync(process.execPath, ['--check', file]);
    if (check.status !== 0) {
      console.error(`✗ Syntax error in ${file} after patching! Aborting.`);
      process.exit(1);
    }
    patched++;
    console.log(`✓ Patched: ${file}`);
  } else {
    console.log(`  Already patched: ${file}`);
  }
}
console.log(`Done. ${patched} file(s) patched.`);
