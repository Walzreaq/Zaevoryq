// ZAEVORYQ AI — Authentication System
// Powered by Supabase

const SUPABASE_URL = 'https://ftccjvqshbdyfmwxerbu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y2NqdnFzaGJkeWZtd3hlcmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDE2MzUsImV4cCI6MjA5NDExNzYzNX0.PWvygXx-trvAsJeE8f3RakjJH_vyvEzy8r4PwJRF3V4';

// Wait for Supabase CDN to load then initialize
let _sb = null;

function getClient() {
  if (_sb) return _sb;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('ZAEVORYQ AI — Supabase connected ✅');
    return _sb;
  }
  return null;
}

// ============================================
// SIGN UP
// ============================================
async function signUp(email, password, firstName, lastName) {
  const sb = getClient();
  if (!sb) return { success: false, message: 'Connection error. Please refresh.' };
  try {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name:  lastName,
          full_name:  `${firstName} ${lastName}`,
          plan:       'free',
        }
      }
    });
    if (error) throw error;

    // Create profile in background
    if (data.user) {
      createUserProfile(data.user.id, { email, first_name: firstName, last_name: lastName }).catch(()=>{});
    }

    return { success: true, message: 'Account created! Please check your email to verify.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================
// SIGN IN
// ============================================
async function signIn(email, password) {
  const sb = getClient();
  if (!sb) return { success: false, message: 'Connection error. Please refresh.' };
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Set basic user data immediately
    window.ZaevoryqUser = { id: data.user.id, email: data.user.email, plan: 'free' };

    // Load full profile in background
    loadUserProfile(data.user.id).catch(()=>{});

    // Redirect to dashboard immediately
    window.location.href = 'dashboard.html';
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================
// GOOGLE SIGN IN
// ============================================
async function signInWithGoogle() {
  const sb = getClient();
  if (!sb) return;
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard.html` }
    });
    if (error) throw error;
  } catch (err) {
    console.error('Google sign in error:', err);
  }
}

// ============================================
// SIGN OUT
// ============================================
async function signOut() {
  const sb = getClient();
  if (sb) await sb.auth.signOut().catch(()=>{});
  window.ZaevoryqUser = null;
  window.location.href = 'login.html';
}

// ============================================
// FORGOT PASSWORD
// ============================================
async function forgotPassword(email) {
  const sb = getClient();
  if (!sb) return { success: false, message: 'Connection error. Please refresh.' };
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });
    if (error) throw error;
    return { success: true, message: 'Password reset email sent! Check your inbox.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================
// CREATE USER PROFILE
// ============================================
async function createUserProfile(userId, profileData) {
  const sb = getClient();
  if (!sb) return;
  try {
    await sb.from('profiles').insert([{
      id:           userId,
      email:        profileData.email,
      first_name:   profileData.first_name,
      last_name:    profileData.last_name,
      plan:         'free',
      signals_used: 0,
      win_rate:     0,
    }]);
  } catch (err) {
    console.warn('Profile create:', err.message);
  }
}

// ============================================
// LOAD USER PROFILE
// ============================================
async function loadUserProfile(userId) {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data, error } = await Promise.race([
      sb.from('profiles').select('*').eq('id', userId).single(),
      new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
    ]);
    if (error) throw error;
    window.ZaevoryqUser = data;
    return data;
  } catch (err) {
    console.warn('Profile load:', err.message);
    return window.ZaevoryqUser || null;
  }
}

// ============================================
// GET CURRENT USER
// ============================================
async function getCurrentUser() {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) return null;

    // Set basic data immediately
    if (!window.ZaevoryqUser) {
      window.ZaevoryqUser = {
        id:    session.user.id,
        email: session.user.email,
        plan:  'free'
      };
    }

    // Try to load full profile
    const profile = await loadUserProfile(session.user.id);
    return profile || window.ZaevoryqUser;
  } catch (err) {
    console.warn('getCurrentUser:', err.message);
    return null;
  }
}

// ============================================
// REQUIRE AUTH — redirect if not logged in
// ============================================
async function requireAuth() {
  try {
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), 6000));
    const user    = await Promise.race([getCurrentUser(), timeout]);
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  } catch (err) {
    window.location.href = 'login.html';
    return null;
  }
}

// ============================================
// HAS FEATURE — all free now
// ============================================
function hasFeature(feature) {
  return true; // All features free for all users
}

// ============================================
// LISTEN FOR AUTH STATE CHANGES
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure Supabase CDN loaded
  setTimeout(() => {
    const sb = getClient();
    if (sb) {
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          window.ZaevoryqUser = { id: session.user.id, email: session.user.email, plan: 'free' };
          loadUserProfile(session.user.id).catch(()=>{});
        }
        if (event === 'SIGNED_OUT') {
          window.ZaevoryqUser = null;
        }
      });
    }
  }, 500);
});

// Export
window.ZaevoryqAuth = {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  forgotPassword,
  getCurrentUser,
  requireAuth,
  hasFeature,
  get supabase() { return getClient(); },
};

console.log('ZAEVORYQ AI — Auth System Loaded ✅');
