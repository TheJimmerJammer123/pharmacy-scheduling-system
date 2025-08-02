#!/usr/bin/env node

// Generate Supabase API Keys Script
// This script generates proper ANON_KEY and SERVICE_ROLE_KEY using the JWT secret

const crypto = require('crypto');

// JWT secret from your .env file
const JWT_SECRET = 'fMvZdFHAkEW6HoWkKfj8IukvHEcn53344UcCMgLyD3o=';

// Generate JWT payload for anon key
const anonPayload = {
  iss: 'supabase',
  ref: 'pharm-scheduling',
  role: 'anon',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
};

// Generate JWT payload for service role key
const serviceRolePayload = {
  iss: 'supabase',
  ref: 'pharm-scheduling',
  role: 'service_role',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
};

// Simple JWT encoding (for demonstration - in production use a proper JWT library)
function encodeJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  
  return `${data}.${signature}`;
}

// Generate the keys
const anonKey = encodeJWT(anonPayload, JWT_SECRET);
const serviceRoleKey = encodeJWT(serviceRolePayload, JWT_SECRET);

console.log('🔑 Generated Supabase API Keys:');
console.log('');
console.log('ANON_KEY=' + anonKey);
console.log('');
console.log('SERVICE_ROLE_KEY=' + serviceRoleKey);
console.log('');
console.log('📝 Update your .env file with these new keys');
console.log('⚠️  Make sure to restart your Supabase services after updating'); 