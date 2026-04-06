export const prerender = false;

import { makeHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

const _handler = makeHandler({ config });

export const ALL = async (context: any) => {
  try {
    return await _handler(context);
  } catch (err: any) {
    console.error('[KS] Unhandled error:', err?.message ?? String(err));
    console.error('[KS] Stack:', err?.stack ?? '(no stack)');
    return new Response(
      JSON.stringify({ error: 'Keystatic handler error', message: err?.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
};
