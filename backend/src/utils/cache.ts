import NodeCache from 'node-cache';

// Initialize cache with a standard TTL of 24 hours (86400 seconds)
// We use a long TTL because our background poller will handle early invalidation
// if changes are detected on the WordPress side.
export const cache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });
