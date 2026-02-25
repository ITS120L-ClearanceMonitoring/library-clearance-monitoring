import { useEffect, useRef, useState } from 'react';

/**
 * Hook to handle automatic logout after inactivity
 * @param {function} onLogout - Callback function to execute on timeout
 * @param {number} timeoutMinutes - Inactivity timeout in minutes (default: 30)
 * @param {number} warningMinutes - Show warning this many minutes before timeout (default: 5)
 */
export const useInactivityTimeout = (onLogout, timeoutMinutes = 0.033, warningMinutes = 0.016) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Convert minutes to milliseconds
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000; // 2 mins for testing
  const WARNING_MS = warningMinutes * 60 * 1000; // 1.5 mins for testing

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Hide warning if visible
    setShowWarning(false);

    console.log('🔄 Inactivity timer reset');

    // Set warning timer (fires at TIMEOUT_MS - WARNING_MS)
    warningRef.current = setTimeout(() => {
      console.log('⚠️ Showing inactivity warning');
      setShowWarning(true);
      setRemainingSeconds(Math.ceil(WARNING_MS / 1000));

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, TIMEOUT_MS - WARNING_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      console.log('⏱️ Inactivity timeout reached - logging out');
      setShowWarning(false);
      onLogout();
    }, TIMEOUT_MS);
  };

  // Dismiss warning and reset timer
  const dismissWarning = () => {
    console.log('✅ User dismissed warning - resetting timer');
    resetInactivityTimer();
  };

  useEffect(() => {
    // List of events that count as activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      console.log('👤 User activity detected');
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initialize timer on mount
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [onLogout, TIMEOUT_MS, WARNING_MS]);

  return { showWarning, remainingSeconds, dismissWarning };
};
