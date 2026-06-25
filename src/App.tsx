import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from './types';
import { seedDemoStore, getCurrentSession } from './utils';

// Import our modular screens
import Loader from './components/Loader';
import WelcomeScreen from './components/WelcomeScreen';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'loading' | 'welcome' | 'registration' | 'login' | 'dashboard'>('loading');
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Initial setup: Pre-seed local storage with sample accounts & transaction logs
    seedDemoStore();

    // Look for existing active sessions to prevent state loss on manual reloads
    const sessionUser = getCurrentSession();
    if (sessionUser) {
      setActiveUser(sessionUser);
    }
  }, []);

  const handleLoadingComplete = () => {
    // Session Keep-Alive check on initial boot
    const activeSession = getCurrentSession();
    if (activeSession) {
      setActiveUser(activeSession);
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('welcome');
    }
  };

  const handleLoginSuccess = () => {
    const session = getCurrentSession();
    if (session) {
      setActiveUser(session);
      setCurrentScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setActiveUser(null);
    setCurrentScreen('welcome');
  };

  const handleUpdateActiveUser = (updatedProfile: UserProfile) => {
    setActiveUser(updatedProfile);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 selection:bg-cyan-500 selection:text-black">
      <AnimatePresence mode="wait">
        
        {/* Loading Screen sequence */}
        {currentScreen === 'loading' && (
          <motion.div 
            key="loading" 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Loader onComplete={handleLoadingComplete} />
          </motion.div>
        )}

        {/* Welcome selection hub */}
        {currentScreen === 'welcome' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <WelcomeScreen 
              onSelectNewUser={() => setCurrentScreen('registration')}
              onSelectExistingUser={() => setCurrentScreen('login')}
            />
          </motion.div>
        )}

        {/* Account Creation registration form */}
        {currentScreen === 'registration' && (
          <motion.div 
            key="registration"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <RegistrationForm 
              onBack={() => setCurrentScreen('welcome')}
              onSuccess={() => setCurrentScreen('login')}
            />
          </motion.div>
        )}

        {/* Gateway Authenticator login form */}
        {currentScreen === 'login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoginForm 
              onBack={() => setCurrentScreen('welcome')}
              onSuccess={handleLoginSuccess}
            />
          </motion.div>
        )}

        {/* Secured dashboard matrix portal */}
        {currentScreen === 'dashboard' && activeUser && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Dashboard 
              user={activeUser}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateActiveUser}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
