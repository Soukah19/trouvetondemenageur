import { AuthProvider } from './contexts/AuthContext';
import { AppRouter } from './Router';
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Analytics />
    </AuthProvider>
  );
}

export default App;
