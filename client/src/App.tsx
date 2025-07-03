
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Counter } from '../../server/src/schema';

function App() {
  const [counter, setCounter] = useState<Counter>({
    id: 1,
    count: 0,
    updated_at: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load counter data on component mount
  const loadCounter = useCallback(async () => {
    try {
      const result = await trpc.getCounter.query();
      setCounter(result);
      setBackendError(false);
    } catch (error) {
      console.error('Failed to load counter:', error);
      setBackendError(true);
      // Keep the default counter state when backend fails
    } finally {
      setInitialLoadComplete(true);
    }
  }, []);

  useEffect(() => {
    loadCounter();
  }, [loadCounter]);

  const handleAction = async (action: 'increment' | 'decrement' | 'reset') => {
    setIsLoading(true);
    
    try {
      if (!backendError) {
        // Try to use backend first
        const result = await trpc.updateCounter.mutate({ action });
        setCounter(result);
      } else {
        throw new Error('Backend unavailable');
      }
    } catch (error) {
      console.error(`Failed to ${action} counter:`, error);
      setBackendError(true);
      
      // Fallback to local counter updates
      let newCount = counter.count;
      switch (action) {
        case 'increment':
          newCount = counter.count + 1;
          break;
        case 'decrement':
          newCount = counter.count - 1;
          break;
        case 'reset':
          newCount = 0;
          break;
      }
      
      setCounter({
        id: counter.id,
        count: newCount,
        updated_at: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading counter...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-96">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Counter App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backend Error Alert */}
          {backendError && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                🔄 Running in offline mode - changes won't persist
              </AlertDescription>
            </Alert>
          )}

          {/* Counter Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {counter.count}
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {counter.updated_at.toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => handleAction('decrement')}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="w-20"
            >
              -1
            </Button>
            <Button
              onClick={() => handleAction('reset')}
              disabled={isLoading}
              variant="secondary"
              size="lg"
              className="w-20"
            >
              Reset
            </Button>
            <Button
              onClick={() => handleAction('increment')}
              disabled={isLoading}
              size="lg"
              className="w-20"
            >
              +1
            </Button>
          </div>

          {isLoading && (
            <div className="text-center text-sm text-gray-500">
              Updating counter...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
