const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Supabase admin client
const supabaseUrl = 'https://yldgjaegxmnuytqtpvsy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZGdqYWVneG1udXl0cXRwdnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODA4NSwiZXhwIjoyMDgxNjA0MDg1fQ.-qWT9_raStvEZ_3eqJrW5KgeZ-dJOb0DpVTBv2svoEQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

app.use(cors());
app.use(express.json());

// Create user endpoint
app.post('/create-user', async (req, res) => {
  try {
    const { email, role, cuisine } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36) + Math.random().toString(36), // Temporary password
      email_confirm: true
    });

    let userId;

    if (authError) {
      // If user already exists, fetch their ID to recover
      if (authError.message && (authError.message.includes('already registered') || authError.status === 422)) {
        console.log('User already exists, attempting to recover ID...');

        // List users to find the one with this email
        // Note: In production with many users this is inefficient, but for this specific "fix" request it works.
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('Failed to list users for recovery:', listError);
          return res.status(400).json({ error: authError.message });
        }

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          console.log('Found existing user ID:', existingUser.id);
          userId = existingUser.id;
        } else {
          console.error('Could not find existing user despite error.');
          return res.status(400).json({ error: authError.message });
        }
      } else {
        console.error('Auth error:', authError);
        return res.status(400).json({ error: authError.message });
      }
    } else {
      userId = authData.user.id;
    }

    // Insert or update into profiles table (upsert) to avoid unique constraint violations
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        role,
        cuisine: cuisine || null
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      return res.status(400).json({ error: profileError.message });
    }

    res.json({
      message: 'User created/updated successfully',
      user: {
        id: userId,
        email: email
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ping endpoint for testing
app.get('/ping', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
