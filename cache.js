const { LRUCache } = require('lru-cache');

const TWO_HOURS = 2 * 60 * 60 * 1000;

const cache = new LRUCache({
  max: 10_000,
  ttl: TWO_HOURS,
});

module.exports = cache;
