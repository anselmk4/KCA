const fs = require('fs');
const path = require('path');

const envPath = 'd:/saas IA/Kuettu Crypto Academy/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
console.log('Client ID:', clientId);

const url = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
console.log('Fetching SDK URL:', url);

fetch(url)
  .then(async res => {
    console.log('Response Status:', res.status);
    console.log('Response Headers:', Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log('Body length:', body.length);
    if (res.status !== 200) {
      console.log('Body (first 500 chars):', body.substring(0, 500));
    }
  })
  .catch(err => {
    console.error('Fetch error:', err);
  });
