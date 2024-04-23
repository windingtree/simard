import {SimpleTimeEvictionBasedCache} from '../../../../src/lib/cache';

describe('SimpleTimeEvictionBasedCache', () => {
  it('should correctly add items to cache and return by key if the expiry time did not expire yet', () => {
    const cache = new SimpleTimeEvictionBasedCache<string, string>(1000);
    expect(cache.size()).toEqual(0);

    cache.put('key1', 'value1');
    expect(cache.size()).toEqual(1);
    expect(cache.get('key1')).toEqual('value1');

    cache.put('key2', 'value2');
    expect(cache.size()).toEqual(2);
    expect(cache.get('key2')).toEqual('value2');
  });

  it('should evict all entries from cache once eviction time expires',  (done) => {
    const evictionTimeInMillis = 500;
    const cache = new SimpleTimeEvictionBasedCache<string, string>(evictionTimeInMillis);

    cache.put('key1', 'value1');
    cache.put('key2', 'value2');
    expect(cache.get('key1')).toEqual('value1');
    expect(cache.get('key2')).toEqual('value2');

    setTimeout(() => {
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      done();
    }, 2 * evictionTimeInMillis);
  });
});
