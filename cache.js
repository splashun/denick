const { LRUCache } = require('lru-cache');

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const cache = new LRUCache({
  max: 10_000,
  ttl: TWENTY_FOUR_HOURS,
});

module.exports = cache;
