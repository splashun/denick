const { LRUCache } = require('lru-cache');

const TEN_MINUTES = 10 * 60 * 1000;

const cache = new LRUCache({
  max: 10_000,
  ttl: TEN_MINUTES,
});

module.exports = cache;
