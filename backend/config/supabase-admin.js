const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
  console.warn('Supabase admin client is missing SUPABASE_SERVICE_ROLE_KEY. Admin routes and seed scripts will not work until it is set.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey || process.env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabaseAdmin;