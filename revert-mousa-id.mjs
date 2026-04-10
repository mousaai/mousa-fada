import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const pool = mysql.createPool(process.env.DATABASE_URL);
const db = drizzle(pool);

// التراجع: إعادة mousaUserId=null للمستخدمين الذين ربطناهم خطأً بـ userId=1
const wrongOpenIds = [
  'DEs96ZBDYgodeLRHeyAcjq',
  'K6tZoWABhPgGUc2zXDLQX8',
  '2V4Vcy7YvVbaSPTSunUEtw',
  'WrqKAYTairh8rAJpo4yp5P',
  'TjUtWhFmWzFxcMMCR6AkUQ',
  'h4NAE9BeTD6mLKyUtcuqvr',
];

for (const openId of wrongOpenIds) {
  await db.update(users)
    .set({ mousaUserId: null, mousaBalance: 0 })
    .where(eq(users.openId, openId));
  console.log('Reverted:', openId);
}

// التحقق من حسابك (mousaUserId=2)
const myUser = await db.select().from(users).where(eq(users.openId, 'ZiSTZeFw48Gx7FpBCmCndh'));
console.log('Your account:', JSON.stringify({ openId: myUser[0]?.openId, name: myUser[0]?.name, mousaUserId: myUser[0]?.mousaUserId, mousaBalance: myUser[0]?.mousaBalance }));

await pool.end();
console.log('Done!');
