import { WorkOS } from '@workos-inc/node';
import { config } from './config';

export const workos = new WorkOS(config.WORKOS_API_KEY);
