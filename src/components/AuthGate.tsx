import { createContext, useContext, useEffect, useState } from 'react';
import { Check, LockKeyhole, PawPrint, ShieldCheck } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const LOCAL_MODE_KEY = 'dashbarkLocalMode';

type AuthContextValue = {
  session: Session | null;
  localMode: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthGate');
  return auth;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
      <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.7Z" />
      <path fill="#FBBC05" d="M6.54 13.78a5.85 5.85 0 0 1 0-3.56V7.69H3.3a9.75 9.75 0 0 0 0 8.62l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.19c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.25 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.91 9.46 6.19 12 6.19Z" />
    </svg>
  );
}

function AuthScreen({ onContinueLocal }: { onContinueLocal: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    if (!supabase) {
      setError('Google sign-in is not configured yet. Add the Supabase environment variables to enable it.');
      return;
    }

    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 fade-in" style={{ background: 'var(--bg)' }}>
      <div className="w-full text-center" style={{ maxWidth: 430 }}>
        <div
          className="mx-auto grid place-items-center mb-5"
          style={{
            width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(150deg, var(--brass), var(--brass-deep))',
            color: '#241a08',
          }}
        >
          <PawPrint size={36} />
        </div>
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Welcome to Dashbark</h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.55, marginBottom: 28 }}>
          Keep your dog&apos;s care journal safe and available wherever you are.
        </p>

        <div className="panel-card pad text-left mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid place-items-center rounded-lg" style={{ width: 38, height: 38, background: 'var(--tint-med)', color: 'var(--brass)' }}>
              <ShieldCheck size={19} />
            </div>
            <div>
              <b style={{ fontSize: 14 }}>Sign in to save your journal</b>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Your data stays linked to your account.</div>
            </div>
          </div>
          <button className="btn primary w-full" onClick={signInWithGoogle} disabled={loading}>
            <GoogleMark />
            {loading ? 'Opening Google…' : 'Continue with Google'}
          </button>
          {!isSupabaseConfigured && (
            <div className="flex items-center gap-2 mt-3" style={{ color: 'var(--amber)', fontSize: 12 }}>
              <LockKeyhole size={13} />
              Google sign-in needs Supabase environment variables.
            </div>
          )}
          {error && <div role="alert" aria-live="polite" className="mt-3" style={{ color: 'var(--rust-light)', fontSize: 12 }}>{error}</div>}
        </div>

        <button className="btn ghost" onClick={onContinueLocal}>
          <Check size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          Continue without an account
        </button>
        <div className="mt-3" style={{ color: 'var(--muted-2)', fontSize: 11 }}>
          Local mode keeps your journal in this browser only.
        </div>
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [localMode, setLocalMode] = useState(() => localStorage.getItem(LOCAL_MODE_KEY) === '1');

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return <div className="min-h-screen grid place-items-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>Loading your journal…</div>;
  }

  if (!session && !localMode) {
    return (
      <AuthScreen
        onContinueLocal={() => {
          localStorage.setItem(LOCAL_MODE_KEY, '1');
          setLocalMode(true);
        }}
      />
    );
  }

  const signOut = async () => {
    if (session && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    localStorage.removeItem(LOCAL_MODE_KEY);
    setSession(null);
    setLocalMode(false);
  };

  return (
    <AuthContext.Provider value={{ session, localMode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
