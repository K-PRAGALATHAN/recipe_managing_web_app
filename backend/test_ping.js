/**
 * Test script for the ping endpoint
 * Usage: node test_ping.js
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

async function testPing() {
  console.log('Testing ping endpoint...\n');
  
  try {
    const response = await fetch(`${BACKEND_URL}/ping`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Ping test passed!');
    console.log('Response:', data);
    console.log(`\nStatus: ${response.status}`);
    
    return true;
  } catch (error) {
    console.error('❌ Ping test failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Make sure the backend server is running on', BACKEND_URL);
      console.error('   Start it with: cd backend && node index.js');
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testPing().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testPing };

