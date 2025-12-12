const authService = require('../../services/authService');

/**
 * Login admin user
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Username and password are required',
          status: 400,
        },
      });
    }

    const result = await authService.login(username, password);

    res.json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          status: 401,
        },
      });
    }

    if (error.message === 'User account is inactive') {
      return res.status(403).json({
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is inactive',
          status: 403,
        },
      });
    }

    next(error);
  }
}

/**
 * Logout admin user
 */
async function logout(req, res, next) {
  try {
    const token = req.token; // Set by auth middleware

    await authService.logout(token);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user info
 */
async function me(req, res, next) {
  try {
    // req.user is set by auth middleware
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
  me,
};
