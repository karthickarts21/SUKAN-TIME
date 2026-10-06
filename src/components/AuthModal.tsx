import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import { auth, syncUserProfile } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncedNotice?: string;
  syncStatus?: 'connected' | 'syncing' | 'offline' | 'error' | 'disconnected';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSyncNow,
  isSyncing = false,
  lastSyncedNotice = '',
  syncStatus = 'connected',
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );
        await syncUserProfile(userCred.user);
        setSuccessMsg('Account created successfully! Cloud sync is now active.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const userCred = await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );
        await syncUserProfile(userCred.user);
        setSuccessMsg('Signed in successfully! Cloud data connected.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = 'An error occurred during authentication.';
      if (err.code === 'auth/invalid-email') {
        message = 'The email address is not valid.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'The password is too weak. Please use at least 6 characters.';
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setSuccessMsg('Signed out successfully.');
      setTimeout(() => {
        resetForm();
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-neutral-200/90 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain bg-transparent border-0 shadow-none outline-none"
            />
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {currentUser ? 'Cloud Account & Sync' : isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <span className="text-[10px] text-neutral-400 block font-mono">
                Encrypted Cloud Sync
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="text-xs font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-xs font-semibold">{successMsg}</span>
            </div>
          )}

          {/* VIEW WHEN ALREADY LOGGED IN */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Logged In User
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                      syncStatus === 'error'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : syncStatus === 'offline'
                        ? 'bg-neutral-200 text-neutral-700 border border-neutral-300'
                        : syncStatus === 'syncing' || isSyncing
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        syncStatus === 'error'
                          ? 'bg-rose-500'
                          : syncStatus === 'offline'
                          ? 'bg-neutral-500'
                          : syncStatus === 'syncing' || isSyncing
                          ? 'bg-amber-500 animate-ping'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {syncStatus === 'error'
                      ? 'Sync Error'
                      : syncStatus === 'offline'
                      ? 'Offline'
                      : syncStatus === 'syncing' || isSyncing
                      ? 'Syncing...'
                      : 'Real-Time Sync Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser.email ? currentUser.email[0] : 'U'}
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-neutral-900 truncate">
                      {currentUser.email}
                    </span>
                    <span className="block text-[10px] font-mono text-emerald-600 truncate">
                      ✓ Connected & Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* CLOUD STORAGE DETAILS */}
              <div className="p-3 bg-sky-50/60 border border-sky-200/70 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-sky-950 font-bold text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-sky-700" />
                  <span>Real-Time Cloud Sync</span>
                </div>
                <p className="text-[11px] text-sky-900 leading-relaxed">
                  Real-time synchronization is live. Any edits made on this or any other device (PC, laptop, mobile) update automatically across all your devices.
                </p>
                {lastSyncedNotice && (
                  <div className="text-[10px] font-mono text-sky-800 pt-1 border-t border-sky-200/50">
                    {lastSyncedNotice}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-2 pt-1">
                {onSyncNow && (
                  <button
                    type="button"
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing with Firestore...' : 'Sync Cloud Data Now'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* VIEW WHEN LOGGED OUT: EMAIL + PASSWORD FORM */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-[11px] text-neutral-600 leading-normal">
                {isSignUp
                  ? 'Create an account to securely save your BroTime attendance and salary records to Cloud Firestore.'
                  : 'Sign in to access your cloud-saved attendance records, salary settings, and daily logs.'}
              </p>

              {/* EMAIL */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg text-xs font-medium outline-none transition-colors"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg text-xs font-mono font-medium outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 rounded cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD (ONLY SIGN UP) */}
              {isSignUp && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 rounded-lg text-xs font-mono font-medium outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>

              {/* TOGGLE SIGN IN / SIGN UP */}
              <div className="pt-2 text-center border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline underline-offset-2 cursor-pointer"
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
