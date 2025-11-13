const jwt = require('jsonwebtoken');

// 環境変数からJWT_SECRETを取得（デフォルト値あり）
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// テスト用のユーザー情報
const payload = {
  userId: 'user001',
  username: 'test-user',
  permissions: ['read:patient', 'write:summary', 'approve:summary'],
};

// トークンを生成（有効期限: 24時間）
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('=== JWT Token ===');
console.log(token);
console.log('\n=== 使用方法 ===');
console.log(`Authorization: Bearer ${token}`);
console.log('\n=== テスト用curlコマンド例 ===');
console.log(`curl -X GET "http://localhost:3000/api/v1/patients/P001" \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -H "Content-Type: application/json"`);

