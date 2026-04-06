export const prerender = false;

import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

const _handler = makeHandler({ config });

// Vercel internal rewrites (to /_render) cause the host to appear as "localhost".
// This wrapper fixes the request URL before Keystatic builds the OAuth redirect_uri.
export const ALL = async (context: any) => {
  const url = new URL(context.request.url);

  console.log('[KS] >>> method:', context.request.method, 'path:', url.pathname, 'hostname:', url.hostname);
  console.log('[KS] >>> cookie:', context.request.headers.get('cookie')?.slice(0, 200) ?? '(none)');

  if (process.env.VERCEL && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
    const appUrl = (process.env.APP_URL || 'https://www.enomia.app').replace(/\/$/, '');
    const correctedUrl = context.request.url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
      appUrl
    );
    const correctedRequest = new Request(correctedUrl, {
      method: context.request.method,
      headers: context.request.headers,
      body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
      // Required for streaming bodies in Node.js (fixes POST body being lost)
      // @ts-expect-error - duplex not in TS types but needed at runtime
      duplex: 'half',
    });
    const res1 = await _handler({ ...context, request: correctedRequest });
    console.log('[KS] <<< status (corrected url):', res1.status);
    return res1;
  }

  const res2 = await _handler(context);
  console.log('[KS] <<< status:', res2.status);
  return res2;
};
