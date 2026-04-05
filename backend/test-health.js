const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is responding - Status: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('❌ Cannot connect to server:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Request timed out');
  req.abort();
  process.exit(1);
});

console.log('Testing server health...');
req.end();
