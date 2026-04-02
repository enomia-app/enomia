export const prerender = false;

import { makeHandler } from '@keystatic/astro/api';
import keystaticConfig from '../../../../keystatic.config';

const handler = makeHandler(keystaticConfig);

export const GET = handler;
export const POST = handler;
