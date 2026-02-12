import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Merges Auth data with your custom 'users' table in the Public schema
  const fetchProfile = async (authUser) => {
    // If no authUser is provided, we must stop loading and exit
    if (!authUser) {
      console.log("No authUser provided, skipping profile fetch");
      return;
    }

    try {
      console.log("=== PROFILE FETCH START ===");
      console.log("User ID:", authUser.id);
      console.log("User email:", authUser.email);
      
      // Update last_login timestamp
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authUser.id);
      
      if (updateError) {
        console.warn("Failed to update last_login:", updateError);
      } else {
        console.log("✅ Updated last_login");
      }
      
      // Query Supabase without timeout - let it complete naturally
      // Disable caching to ensure we get fresh data
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      console.log("=== QUERY COMPLETED ===");
      console.log("Error:", error);
      console.log("Data:", data);
      console.log("must_change_password from DB:", data?.must_change_password);

      if (error) {
        console.error("PROFILE FETCH FAILED:", error.code, error.message);
        console.log("Setting user with AUTH data only (no profile)");
        // Default to must_change_password: false if we can't fetch profile
        setUser({ ...authUser, must_change_password: false });
      } else if (!data) {
        console.warn("NO PROFILE DATA - User record may not exist");
        setUser({ ...authUser, must_change_password: false });
      } else {
        console.log("PROFILE FOUND - Merging with auth data");
        console.log("Role from profile:", data.role);
        const mergedUser = { ...authUser, ...data };
        console.log("Final merged user - must_change_password:", mergedUser.must_change_password);
        setUser(mergedUser);
      }
    } catch (err) {
      console.error("CRITICAL ERROR:", err);
      setUser({ ...authUser, must_change_password: false });
    }
  };

  const handleLogout = async () => {
    try {
      // Clear user immediately for instant UI update
      setUser(null);
      // Then sign out from Supabase
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear user even if error occurs
      setUser(null);
      throw err;
    }
  };

  useEffect(() => {
    // Set loading to false immediately so login page shows instantly
    setLoading(false);
    
    // Listen for Auth changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event Fired:", event);
      
      if (session) {
        // Set user immediately with auth data so dashboard shows instantly
        setUser(session.user);
        // Fetch profile in background without blocking - it will update the user with role AND must_change_password
        setTimeout(() => {
          fetchProfile(session.user);
        }, 100);  // Reduced from 500ms to 100ms for faster profile merge
      } else {
        // On logout or no session, clear the user
        setUser(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {/* Visual feedback to ensure the app hasn't crashed during init */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'sans-serif' 
        }}>
          <h2>Initializing Library System...</h2>
          <p>Connecting to secure database...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// The custom hook used by DashboardLayout and ProtectedRoute
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};