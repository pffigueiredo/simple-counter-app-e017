
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type UpdateCounterInput } from '../schema';
import { updateCounter } from '../handlers/update_counter';
import { eq } from 'drizzle-orm';

describe('updateCounter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should increment counter from 0 to 1', async () => {
    const input: UpdateCounterInput = { action: 'increment' };
    
    const result = await updateCounter(input);
    
    expect(result.count).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should increment existing counter', async () => {
    // Create initial counter
    await db.insert(countersTable)
      .values({ count: 5, updated_at: new Date() })
      .execute();

    const input: UpdateCounterInput = { action: 'increment' };
    
    const result = await updateCounter(input);
    
    expect(result.count).toEqual(6);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should decrement counter', async () => {
    // Create initial counter
    await db.insert(countersTable)
      .values({ count: 5, updated_at: new Date() })
      .execute();

    const input: UpdateCounterInput = { action: 'decrement' };
    
    const result = await updateCounter(input);
    
    expect(result.count).toEqual(4);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should reset counter to 0', async () => {
    // Create initial counter
    await db.insert(countersTable)
      .values({ count: 42, updated_at: new Date() })
      .execute();

    const input: UpdateCounterInput = { action: 'reset' };
    
    const result = await updateCounter(input);
    
    expect(result.count).toEqual(0);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated counter to database', async () => {
    const input: UpdateCounterInput = { action: 'increment' };
    
    const result = await updateCounter(input);
    
    // Verify in database
    const counters = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, result.id))
      .execute();

    expect(counters).toHaveLength(1);
    expect(counters[0].count).toEqual(1);
    expect(counters[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple operations sequentially', async () => {
    // Increment
    await updateCounter({ action: 'increment' });
    await updateCounter({ action: 'increment' });
    
    // Decrement
    const result = await updateCounter({ action: 'decrement' });
    
    expect(result.count).toEqual(1);
  });

  it('should allow decrementing below zero', async () => {
    // Start with counter at 0 (created automatically)
    await updateCounter({ action: 'increment' }); // count = 1
    await updateCounter({ action: 'decrement' }); // count = 0
    
    const result = await updateCounter({ action: 'decrement' }); // count = -1
    
    expect(result.count).toEqual(-1);
  });
});
