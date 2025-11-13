import { CacheManager } from '../cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager();
  });

  it('should store and retrieve data', async () => {
    // Given
    const key = 'test-key';
    const value = { test: 'data' };

    // When
    await cacheManager.set(key, value);
    const result = await cacheManager.get<typeof value>(key);

    // Then
    expect(result).toEqual(value);
  });

  it('should return null when key does not exist', async () => {
    // Given
    const key = 'non-existent-key';

    // When
    const result = await cacheManager.get(key);

    // Then
    expect(result).toBeNull();
  });

  it('should delete data', async () => {
    // Given
    const key = 'test-key';
    const value = { test: 'data' };
    await cacheManager.set(key, value);

    // When
    await cacheManager.delete(key);
    const result = await cacheManager.get(key);

    // Then
    expect(result).toBeNull();
  });

  it('should clear all data', async () => {
    // Given
    await cacheManager.set('key1', 'value1');
    await cacheManager.set('key2', 'value2');

    // When
    await cacheManager.clear();
    const result1 = await cacheManager.get('key1');
    const result2 = await cacheManager.get('key2');

    // Then
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });
});

