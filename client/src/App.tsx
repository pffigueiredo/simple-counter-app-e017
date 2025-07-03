import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage or default to light mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDarkMode(prefersDark);
    
    // Apply theme to html element
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    // Apply theme to html element
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-lg text-foreground">Loading counter...</div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
          <Switch
            checked={isDarkMode}
            onCheckedChange={toggleTheme}
            aria-label="Toggle dark mode"
          />
        </div>
      </div>

      <Card className="w-96">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Counter App</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backend Error Alert */}
          {backendError && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                🔄 Running in offline mode - changes won't persist
              </AlertDescription>
            </Alert>
          )}

          {/* Counter Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {counter.count}
            </div>
            <div className="text-sm text-muted-foreground">
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
            <div className="text-center text-sm text-muted-foreground">
              Updating counter...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;