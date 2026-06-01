// ZAEVORYQ AI — Authentication System
// Powered by Supabase

const SUPABASE_URL = 'https://ftccjvqshbdyfmwxerbu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0Y2NqdnFzaGJkeWZtd3hlcmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDE2MzUsImV4cCI6MjA5NDExNzYzNX0.PWvygXx-trvAsJeE8f3RakjJH_vyvEzy8r4PwJRF3V4';

// Load Supabase client
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// SIGN UP WITH EMAIL & PASSWORD
// ============================================
async function signUp(email, password, firstName, lastName) {
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
          joined:     new Date().toISOString(),
        }
      }
    });

    if (error) throw error;

    // Create user profile in database
    if (data.user) {
      await createUserProfile(data.user.id, {
        email,
        first_name: firstName,
        last_name:  lastName,
        plan:       'free',
      });
    }

    return { success: true, message: 'Account created! Please check your email to verify.' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================
// SIGN IN WITH EMAIL & PASSWORD
// ============================================
async function signIn(email, password) {
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await loadUserProfile(data.user.id);
    redirectToDashboard();
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ============================================
// SIGN IN WITH GOOGLE
// ============================================
async function signInWithGoogle() {
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard.html`
      }
    });
    if (error) throw error;
  } catch (err) {
    showAuthError(err.message);
  }
}

// ============================================
// SIGN OUT
// ============================================
async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

// ============================================
// FORGOT PASSWORD
// ============================================
async function forgotPassword(email) {
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
// CREATE USER PROFILE IN DATABASE
// ============================================
async function createUserProfile(userId, profileData) {
  try {
    const { error } = await sb.from('profiles').insert([{
      id:           userId,
      email:        profileData.email,
      first_name:   profileData.first_name,
      last_name:    profileData.last_name,
      plan:         'free',
      signals_used: 0,
      win_rate:     0,
      created_at:   new Date().toISOString(),
    }]);
    if (error) console.warn('Profile creation:', error.message);
  } catch (err) {
    console.warn('Profile error:', err);
  }
}

// ============================================
// LOAD USER PROFILE
// ============================================
async function loadUserProfile(userId) {
  try {
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    window.ZaevoryqUser = data;
    return data;
  } catch (err) {
    console.warn('Profile load error:', err);
    return null;
  }
}

// ============================================
// GET CURRENT USER
// ============================================
async function getCurrentUser() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    const profile = await loadUserProfile(session.user.id);
    return profile || session.user;
  }
  return null;
}

// ============================================
// CHECK IF USER IS LOGGED IN
// ============================================
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ============================================
// CHECK PLAN FEATURES
// ============================================
function hasFeature(feature) {
  return true; // All features free for all users
}

// ============================================
// REDIRECT TO DASHBOARD
// ============================================
function redirectToDashboard() {
  window.location.href = 'dashboard.html';
}

// ============================================
// SHOW AUTH ERROR
// ============================================
function showAuthError(message) {
  const errEl = document.getElementById('auth-error');
  if (errEl) {
    errEl.textContent = message;
    errEl.style.display = 'block';
    setTimeout(() => { errEl.style.display = 'none'; }, 5000);
  }
}

// ============================================
// SHOW AUTH SUCCESS
// ============================================
function showAuthSuccess(message) {
  const sucEl = document.getElementById('auth-success');
  if (sucEl) {
    sucEl.textContent = message;
    sucEl.style.display = 'block';
  }
}

// ============================================
// LISTEN FOR AUTH STATE CHANGES
// ============================================
sb.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    await loadUserProfile(session.user.id);
    console.log('ZAEVORYQ AI — User signed in:', session.user.email);
  }
  if (event === 'SIGNED_OUT') {
    window.ZaevoryqUser = null;
    console.log('ZAEVORYQ AI — User signed out');
  }
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
  supabase: sb,
};

console.log('ZAEVORYQ AI — Auth System Loaded ✅');
