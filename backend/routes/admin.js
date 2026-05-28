const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const supabaseAdmin = require('../config/supabase-admin');

const router = express.Router();

const USER_SELECT = 'id,email,name,role,major,academic_year,target_gpa,department,subjects,auth_provider,profile_picture,profile_completed,account_status,teacher_verified,verified_at,created_at';
const MAJOR_SELECT = 'id,name,code,is_active,created_at,updated_at';
const SEMESTER_SELECT = 'id,name,starts_on,ends_on,is_active,created_at,updated_at';
const SETTINGS_SELECT = 'setting_key,setting_value,updated_at';

const mapUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role || 'student',
  major: user.major,
  academicYear: user.academic_year,
  targetGPA: user.target_gpa,
  department: user.department,
  subjects: user.subjects,
  authProvider: user.auth_provider || 'email',
  profilePicture: user.profile_picture,
  profileCompleted: !!user.profile_completed,
  accountStatus: user.account_status || 'active',
  teacherVerified: !!user.teacher_verified,
  verifiedAt: user.verified_at,
  createdAt: user.created_at
});

const adminGuard = [verifyToken, requireRole('admin')];

router.get('/summary', adminGuard, async (_req, res) => {
  try {
    const [students, teachers, admins, activeAccounts, pendingTeachers, majors, semesters] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).neq('account_status', 'deactivated'),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('teacher_verified', false),
      supabaseAdmin.from('majors').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('semesters').select('id', { count: 'exact', head: true })
    ]);

    const error = [students, teachers, admins, activeAccounts, pendingTeachers, majors, semesters].find((result) => result.error)?.error;
    if (error) {
      throw error;
    }

    res.json({
      counts: {
        students: students.count || 0,
        teachers: teachers.count || 0,
        admins: admins.count || 0,
        activeAccounts: activeAccounts.count || 0,
        pendingTeachers: pendingTeachers.count || 0,
        majors: majors.count || 0,
        semesters: semesters.count || 0
      }
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({ message: 'Unable to load admin summary' });
  }
});

router.get('/users', adminGuard, async (req, res) => {
  try {
    const searchTerm = (req.query.search || '').trim();
    const role = req.query.role || 'all';
    const status = req.query.status || 'all';

    let query = supabaseAdmin.from('users').select(USER_SELECT).order('created_at', { ascending: false });

    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (status !== 'all') {
      query = query.eq('account_status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    const users = (data || [])
      .map(mapUser)
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        return [user.name, user.email, user.role, user.department, user.major]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      });

    res.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Unable to load users' });
  }
});

router.patch('/users/:id/role', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ['student', 'teacher', 'admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updatePayload = { role };

    if (role === 'teacher') {
      updatePayload.teacher_verified = false;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select(USER_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.json({ user: mapUser(data) });
  } catch (error) {
    console.error('Admin role update error:', error);
    res.status(500).json({ message: 'Unable to update role' });
  }
});

router.patch('/users/:id/status', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    const allowedStatuses = ['active', 'deactivated'];
    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).json({ message: 'Invalid account status' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ account_status: accountStatus })
      .eq('id', id)
      .select(USER_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.json({ user: mapUser(data) });
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ message: 'Unable to update account status' });
  }
});

router.patch('/users/:id/verify-teacher', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherVerified = true } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        role: 'teacher',
        teacher_verified: !!teacherVerified,
        verified_at: teacherVerified ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select(USER_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.json({ user: mapUser(data) });
  } catch (error) {
    console.error('Teacher verification error:', error);
    res.status(500).json({ message: 'Unable to verify teacher' });
  }
});

router.get('/academic', adminGuard, async (_req, res) => {
  try {
    const [majorsResult, semestersResult, settingsResult] = await Promise.all([
      supabaseAdmin.from('majors').select(MAJOR_SELECT).order('created_at', { ascending: false }),
      supabaseAdmin.from('semesters').select(SEMESTER_SELECT).order('created_at', { ascending: false }),
      supabaseAdmin.from('system_settings').select(SETTINGS_SELECT).order('setting_key', { ascending: true })
    ]);

    const resultError = [majorsResult, semestersResult, settingsResult].find((result) => result.error)?.error;
    if (resultError) {
      throw resultError;
    }

    res.json({
      majors: majorsResult.data || [],
      semesters: semestersResult.data || [],
      settings: settingsResult.data || []
    });
  } catch (error) {
    console.error('Academic setup error:', error);
    res.status(500).json({ message: 'Unable to load academic setup' });
  }
});

router.post('/majors', adminGuard, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Major name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('majors')
      .insert([{ name, code: code || null, is_active: true }])
      .select(MAJOR_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ major: data });
  } catch (error) {
    console.error('Create major error:', error);
    res.status(500).json({ message: 'Unable to create major' });
  }
});

router.patch('/majors/:id', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;
    const updatePayload = {};

    if (typeof name === 'string') updatePayload.name = name;
    if (typeof code === 'string') updatePayload.code = code;
    if (typeof isActive === 'boolean') updatePayload.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('majors')
      .update(updatePayload)
      .eq('id', id)
      .select(MAJOR_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.json({ major: data });
  } catch (error) {
    console.error('Update major error:', error);
    res.status(500).json({ message: 'Unable to update major' });
  }
});

router.delete('/majors/:id', adminGuard, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('majors').delete().eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete major error:', error);
    res.status(500).json({ message: 'Unable to delete major' });
  }
});

router.post('/semesters', adminGuard, async (req, res) => {
  try {
    const { name, startsOn, endsOn } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Semester name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('semesters')
      .insert([{ name, starts_on: startsOn || null, ends_on: endsOn || null, is_active: true }])
      .select(SEMESTER_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ semester: data });
  } catch (error) {
    console.error('Create semester error:', error);
    res.status(500).json({ message: 'Unable to create semester' });
  }
});

router.patch('/semesters/:id', adminGuard, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startsOn, endsOn, isActive } = req.body;
    const updatePayload = {};

    if (typeof name === 'string') updatePayload.name = name;
    if (typeof startsOn === 'string') updatePayload.starts_on = startsOn;
    if (typeof endsOn === 'string') updatePayload.ends_on = endsOn;
    if (typeof isActive === 'boolean') updatePayload.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('semesters')
      .update(updatePayload)
      .eq('id', id)
      .select(SEMESTER_SELECT)
      .single();

    if (error) {
      throw error;
    }

    res.json({ semester: data });
  } catch (error) {
    console.error('Update semester error:', error);
    res.status(500).json({ message: 'Unable to update semester' });
  }
});

router.delete('/semesters/:id', adminGuard, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('semesters').delete().eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete semester error:', error);
    res.status(500).json({ message: 'Unable to delete semester' });
  }
});

router.get('/settings', adminGuard, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select(SETTINGS_SELECT)
      .order('setting_key', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ settings: data || [] });
  } catch (error) {
    console.error('Settings load error:', error);
    res.status(500).json({ message: 'Unable to load settings' });
  }
});

router.patch('/settings', adminGuard, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings must be an array' });
    }

    const payload = settings.map((item) => ({
      setting_key: item.settingKey,
      setting_value: item.settingValue
    }));

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .upsert(payload, { onConflict: 'setting_key' })
      .select(SETTINGS_SELECT);

    if (error) {
      throw error;
    }

    res.json({ settings: data || [] });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ message: 'Unable to save settings' });
  }
});

module.exports = router;