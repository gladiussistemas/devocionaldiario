const { supabase, handleResponse } = require('../config/database');
const { hashPassword, comparePassword } = require('../config/auth');

class AdminUser {
  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, email, full_name, is_active, role, last_login, created_at, updated_at')
      .eq('id', id)
      .single();

    return handleResponse({ data, error });
  }

  /**
   * Get all users
   */
  static async findAll() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, email, full_name, is_active, role, last_login, created_at, updated_at')
      .order('created_at', { ascending: false });

    return handleResponse({ data, error });
  }

  /**
   * Create new user
   */
  static async create(userData) {
    const { username, email, password, full_name, role = 'editor' } = userData;

    // Hash password
    const password_hash = await hashPassword(password);

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        email,
        password_hash,
        full_name: full_name || null,
        role,
        is_active: true,
      })
      .select('id, username, email, full_name, is_active, role, created_at, updated_at')
      .single();

    return handleResponse({ data, error });
  }

  /**
   * Update user
   */
  static async update(id, userData) {
    const updateData = {};

    if (userData.username) updateData.username = userData.username;
    if (userData.email) updateData.email = userData.email;
    if (userData.full_name !== undefined) updateData.full_name = userData.full_name;
    if (userData.role) updateData.role = userData.role;
    if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

    // Hash password if provided
    if (userData.password) {
      updateData.password_hash = await hashPassword(userData.password);
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, email, full_name, is_active, role, last_login, created_at, updated_at')
      .single();

    return handleResponse({ data, error });
  }

  /**
   * Delete user
   */
  static async delete(id) {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  /**
   * Verify password
   */
  static async verifyPassword(user, password) {
    return await comparePassword(password, user.password_hash);
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id) {
    const { error } = await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  /**
   * Create session
   */
  static async createSession(userId, token, expiresAt) {
    const { data, error } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    return handleResponse({ data, error });
  }

  /**
   * Find session by token
   */
  static async findSession(token) {
    const { data, error} = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Delete session (logout)
   */
  static async deleteSession(token) {
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('token', token);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  /**
   * Delete expired sessions
   */
  static async cleanExpiredSessions() {
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw new Error(error.message);
    return { success: true };
  }
}

module.exports = AdminUser;
