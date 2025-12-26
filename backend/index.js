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

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Insert into profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        role,
        cuisine: cuisine || null
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // If profile insertion fails, we should probably delete the created user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    res.json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email
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
