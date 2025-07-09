// client/src/App.tsx
// (Keep all your existing imports at the top, like React, useState, useEffect, Route, Routes, etc.)
import { useEffect, useState } from 'react';
import { createClient, Session } from '@supabase/supabase-js'; // Ensure Session type is imported
import { Route, Routes, BrowserRouter } from 'react-router-dom'; // Ensure BrowserRouter is imported
import Home from './components/Home';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';


// --- Supabase Client Initialization ---
// TEMPORARY: Directly paste your keys here for diagnostic purposes only.
// REMEMBER TO REMOVE THESE AFTER TESTING!!!
const SUPABASE_URL_DIRECT: string = "https://bvxceienrftnimcdtbom.supabase.co"; // YOUR_SUPABASE_URL_HERE
const SUPABASE_ANON_KEY_DIRECT: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eGNlaWVucmZ0bmltY2R0Ym9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzMwMzQsImV4cCI6MjA2NjcwOTAzNH0.LBZEQ3ojr_X-tNhA4wK_7d8ZLx2cIlhb_M2sfP1mL-g"; // YOUR_SUPABASE_ANON_KEY_HERE

// Global Supabase instance (or move this to a separate supabaseClient.ts)
let supabase: any = null; // Using 'any' for simplicity during this debug step, or proper type 'SupabaseClient'
if (!SUPABASE_URL_DIRECT || !SUPABASE_ANON_KEY_DIRECT) {
    console.error('CRITICAL ERROR: Supabase URL or Anon Key is missing from direct assignment.');
    throw new Error('Supabase configuration is incomplete due to missing hardcoded values.');
} else {
    supabase = createClient(SUPABASE_URL_DIRECT, SUPABASE_ANON_KEY_DIRECT);
    console.log('Supabase client configured successfully with direct values.');
    console.log('Using URL:', SUPABASE_URL_DIRECT);
    // DO NOT log the anon key for security
}
// --- End Supabase Client Initialization ---

function App() {
  const [session, setSession] = useState<Session | null>(null);

  // If supabase is null due to config error, prevent further execution
  if (!supabase) {
    return <div>Application Error: Configuration Missing. Please contact support.</div>;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }: { data: { session: Session | null } }) => {
      setSession(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log('Starting DomainVault app...');
  // console.log('Environment variables:', import.meta.env); // REMOVE OR COMMENT THIS - could be causing the issue if Vite is mangling it
  console.log('Current Supabase Session:', session); // Log session for debugging

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home session={session} />} />
        <Route path="/signin" element={<SignIn session={session} supabase={supabase} />} />
        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session}>
              <Dashboard session={session} />
            </ProtectedRoute>
          }
        />
        {/* Add more routes here as we build out functionality */}
      </Routes>
    </div>
  );
}

export default App;