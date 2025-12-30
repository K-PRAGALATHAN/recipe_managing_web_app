/**
 * Test script for the create-user endpoint
 * Usage: node test_create_user.js [email] [role] [cuisine]
 * 
 * Example:
 *   node test_create_user.js test@example.com chef Italian
 * 
 * Works with Node.js 18+ (built-in fetch) or older versions with node-fetch
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Use built-in fetch (Node 18+) or try to require node-fetch
let fetch;
try {
  // Try built-in fetch first (Node 18+)
  if (globalThis.fetch) {
    fetch = globalThis.fetch;
  } else {
    // Fallback to node-fetch for older Node versions
    fetch = require('node-fetch');
  }
} catch (e) {
  // If node-fetch is not available, use http/https modules
  const https = require('https');
  const http = require('http');
  const { URL } = require('url');
  
  fetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      };
      
      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data),
          });
        });
      });
      
      req.on('error', reject);
      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  };
}

async function testCreateUser(email, role = 'chef', cuisine = '') {
  console.log('Testing create-user endpoint...\n');
  console.log('Request details:');
  console.log('  Email:', email);
  console.log('  Role:', role);
  console.log('  Cuisine:', cuisine || '(not specified)');
  console.log('');
  
  if (!email) {
    console.error('❌ Error: Email is required');
    console.error('Usage: node test_create_user.js <email> [role] [cuisine]');
    return false;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role,
        cuisine: cuisine || null,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ User creation test passed!');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log(`\nStatus: ${response.status}`);
    console.log('\n💡 Note: User created successfully in Supabase');
    console.log('   The user can now log in using the email:', email);
    
    return true;
  } catch (error) {
    console.error('❌ User creation test failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure the backend server is running on', BACKEND_URL);
      console.error('   Start it with: cd backend && node index.js');
    }
    
    return false;
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const role = args[1] || 'chef';
const cuisine = args[2] || '';

// Run the test
if (require.main === module) {
  testCreateUser(email, role, cuisine).then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testCreateUser };

