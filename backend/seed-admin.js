require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');
const supabaseAdmin = require('./config/supabase-admin');

const ADMIN_EMAIL = 'hamboss@admin.com';
const ADMIN_PASSWORD = 'hamboning1!';
const ADMIN_NAME = 'Admin';

async function findAuthUserByEmail(email) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function seedAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to seed the admin account');
  }

  let authUser = await findAuthUserByEmail(ADMIN_EMAIL);

  if (!authUser) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME, role: 'admin' }
    });

    if (created.error) {
      throw created.error;
    }

    authUser = created.data.user;
  } else {
    const updated = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: ADMIN_NAME, role: 'admin' }
    });

    if (updated.error) {
      throw updated.error;
    }

    authUser = updated.data.user;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const { error: profileError } = await supabaseAdmin.from('users').upsert(
    {
      id: authUser.id,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: ADMIN_NAME,
      role: 'admin',
      auth_provider: 'email',
      profile_completed: true,
      account_status: 'active',
      teacher_verified: true,
      verified_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw profileError;
  }

  console.log(`Seeded admin account for ${ADMIN_EMAIL}`);
}

seedAdmin().catch((error) => {
  console.error('Admin seed failed:', error.message);
  process.exitCode = 1;
});