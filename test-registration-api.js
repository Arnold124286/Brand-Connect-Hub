const http = require('http');

// Test registration endpoint
const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'TestPassword123@',
  fullName: 'Test User',
  userType: 'brand',
  phone: '+254700000000'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nRESPONSE BODY:');
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
