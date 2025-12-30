const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://yldgjaegxmnuytqtpvsy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZGdqYWVneG1udXl0cXRwdnN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjAyODA4NSwiZXhwIjoyMDgxNjA0MDg1fQ.-qWT9_raStvEZ_3eqJrW5KgeZ-dJOb0DpVTBv2svoEQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Confirm a user's email address
 * @param {string} userId - The user ID to confirm
 * @returns {Promise<Object>} - Result of the confirmation
 */
async function confirmUser(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Update user's email confirmation status
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      user: data.user,
      message: 'User email confirmed successfully'
    };
  } catch (error) {
    console.error('Error confirming user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user confirmation status
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} - User confirmation status
 */
async function getUserConfirmationStatus(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      emailConfirmed: data.user.email_confirmed_at !== null,
      user: data.user
    };
  } catch (error) {
    console.error('Error getting user confirmation status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Confirm user by email address
 * @param {string} email - The email address to confirm
 * @returns {Promise<Object>} - Result of the confirmation
 */
async function confirmUserByEmail(email) {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    return await confirmUser(user.id);
  } catch (error) {
    console.error('Error confirming user by email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const identifier = args[1];

  if (!command || !identifier) {
    console.log('Usage:');
    console.log('  node confirmUser.js confirm <userId>        - Confirm user by ID');
    console.log('  node confirmUser.js confirm-email <email>   - Confirm user by email');
    console.log('  node confirmUser.js status <userId>         - Check confirmation status');
    process.exit(1);
  }

  (async () => {
    let result;
    
    switch (command) {
      case 'confirm':
        result = await confirmUser(identifier);
        break;
      case 'confirm-email':
        result = await confirmUserByEmail(identifier);
        break;
      case 'status':
        result = await getUserConfirmationStatus(identifier);
        break;
      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })();
}

module.exports = {
  confirmUser,
  confirmUserByEmail,
  getUserConfirmationStatus
};

