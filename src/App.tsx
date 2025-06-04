import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EarthquakeProvider } from './contexts/EarthquakeContext';
import { Dashboard } from './components/Dashboard';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EarthquakeProvider>
        <div className="h-screen">
          <Dashboard />
        </div>
      </EarthquakeProvider>
    </QueryClientProvider>
  );
}

export default App;
