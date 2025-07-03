
import { db } from '../db';
import { countersTable } from '../db/schema';
import { type UpdateCounterInput, type Counter } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function updateCounter(input: UpdateCounterInput): Promise<Counter> {
  try {
    // First, ensure a counter exists (create if not exists)
    let counter = await db.select()
      .from(countersTable)
      .where(eq(countersTable.id, 1))
      .execute();

    if (counter.length === 0) {
      // Create initial counter
      const newCounter = await db.insert(countersTable)
        .values({
          count: 0,
          updated_at: new Date()
        })
        .returning()
        .execute();
      counter = newCounter;
    }

    // Update counter based on action
    let newCount: number;
    const currentCount = counter[0].count;

    switch (input.action) {
      case 'increment':
        newCount = currentCount + 1;
        break;
      case 'decrement':
        newCount = currentCount - 1;
        break;
      case 'reset':
        newCount = 0;
        break;
    }

    // Update the counter
    const result = await db.update(countersTable)
      .set({
        count: newCount,
        updated_at: new Date()
      })
      .where(eq(countersTable.id, 1))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Counter update failed:', error);
    throw error;
  }
}
