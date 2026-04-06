export const prerender = false;

import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

const _handler = makeHandler({ config });

// Vercel internal rewrites (to /_render) cause the host to appear as "localhost".
// This wrapper fixes the request URL before Keystatic builds the OAuth redirect_uri.
export const all = async (context: any) => {
  const url = new URL(context.request.url);

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
    });
    return _handler({ ...context, request: correctedRequest });
  }

  return _handler(context);
};
