export const prerender = false;

import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

const _handler = makeHandler({ config });

// Vercel internal rewrites (to /_render) cause the host to appear as "localhost".
// This wrapper fixes the request URL before Keystatic builds the OAuth redirect_uri.
export const ALL = async (context: any) => {
  const url = new URL(context.request.url);

  let request = context.request;
  if (process.env.VERCEL && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
    const appUrl = (process.env.APP_URL || 'https://www.enomia.app').replace(/\/$/, '');
    const correctedUrl = context.request.url.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/,
      appUrl
    );
    request = new Request(correctedUrl, {
      method: context.request.method,
      headers: context.request.headers,
      body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
      // Required for streaming bodies in Node.js (fixes POST body being lost)
      // @ts-expect-error - duplex not in TS types but needed at runtime
      duplex: 'half',
    });
  }

  try {
    return await _handler({ ...context, request });
  } catch (err: any) {
    console.error('[KS] Unhandled error:', err?.message ?? String(err));
    return new Response(
      JSON.stringify({ error: 'Keystatic handler error', message: err?.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
};
