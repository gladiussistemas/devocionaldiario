const AdminUser = require('../models/AdminUser');
const { generateToken } = require('../config/auth');
const config = require('../config/environment');

/**
 * Login user and create session
 */
async function login(username, password) {
  // Find user by username or email
  let user = await AdminUser.findByUsername(username);

  if (!user) {
    user = await AdminUser.findByEmail(username);
  }

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('User account is inactive');
  }

  // Verify password
  const isPasswordValid = await AdminUser.verifyPassword(user, password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  // Calculate token expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

  // Create session in database
  await AdminUser.createSession(user.id, token, expiresAt.toISOString());

  // Update last login
  await AdminUser.updateLastLogin(user.id);

  // Return user data (without password) and token
  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    },
  };
}

/**
 * Logout user (invalidate session)
 */
async function logout(token) {
  await AdminUser.deleteSession(token);
  return { success: true };
}

/**
 * Get current user from token
 */
async function getCurrentUser(userId) {
  const user = await AdminUser.findById(userId);
  return user;
}

/**
 * Verify session is valid
 */
async function verifySession(token) {
  const session = await AdminUser.findSession(token);

  if (!session) {
    return null;
  }

  return session;
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  verifySession,
};
