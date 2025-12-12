const { createClient } = require('@supabase/supabase-js');
const config = require('./environment');

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create public client with anon key (for read operations if needed)
const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

/**
 * Helper function to execute raw SQL queries
 * Supabase allows RPC calls to execute custom SQL
 */
async function query(sql, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sql,
      params: params
    });

    if (error) throw error;
    return { rows: data, error: null };
  } catch (error) {
    console.error('Database query error:', error);
    return { rows: null, error };
  }
}

/**
 * Helper function for transactions
 * Note: Supabase doesn't support traditional transactions via JS client
 * Use database functions/procedures for complex transactions
 */
async function transaction(callback) {
  // For complex transactions, create a PostgreSQL function
  // and call it via supabase.rpc()
  try {
    const result = await callback(supabase);
    return { data: result, error: null };
  } catch (error) {
    console.error('Transaction error:', error);
    return { data: null, error };
  }
}

/**
 * Helper to format Supabase responses
 */
function handleResponse({ data, error }) {
  if (error) {
    throw new Error(error.message || 'Database error');
  }
  return data;
}

/**
 * Pagination helper
 */
function paginate(query, page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}

module.exports = {
  supabase,
  supabasePublic,
  query,
  transaction,
  handleResponse,
  paginate,
};
