import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.ts';
import { eq, isNull } from 'drizzle-orm';

const pool = mysql.createPool(process.env.DATABASE_URL);
const db = drizzle(pool);

// فحص المستخدمين الحاليين
const allUsers = await db.select({
  id: users.id,
  openId: users.openId,
  name: users.name,
  mousaUserId: users.mousaUserId,
  mousaBalance: users.mousaBalance,
}).from(users).limit(10);

console.log('Current users:');
allUsers.forEach(u => console.log(JSON.stringify(u)));

// تحديث المستخدمين الذين لديهم mousaUserId = null
// نستخدم check-balance للبحث عن userId الصحيح
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || process.env.MOUSA_PLATFORM_API_KEY;

for (const user of allUsers) {
  if (!user.mousaUserId) {
    console.log(`\nUser ${user.openId} (${user.name}) has no mousaUserId — trying to find...`);
    
    // نجرب userId من 1 إلى 20
    for (let uid = 1; uid <= 20; uid++) {
      try {
        const resp = await fetch(`https://www.mousa.ai/api/platform/check-balance?userId=${uid}`, {
          headers: { 'Authorization': `Bearer ${PLATFORM_API_KEY}`, 'X-Platform-ID': 'fada' }
        });
        const data = await resp.json();
        if (data.balance !== undefined && data.balance > 0) {
          console.log(`  Found userId=${uid} with balance=${data.balance}`);
          // تحديث قاعدة البيانات
          await db.update(users)
            .set({ mousaUserId: String(uid), mousaBalance: data.balance })
            .where(eq(users.openId, user.openId));
          console.log(`  ✅ Updated ${user.openId} → mousaUserId=${uid}, balance=${data.balance}`);
          break;
        }
      } catch {}
    }
  } else {
    // تحديث الرصيد للمستخدمين المربوطين
    try {
      const resp = await fetch(`https://www.mousa.ai/api/platform/check-balance?userId=${user.mousaUserId}`, {
        headers: { 'Authorization': `Bearer ${PLATFORM_API_KEY}`, 'X-Platform-ID': 'fada' }
      });
      const data = await resp.json();
      if (data.balance !== undefined) {
        await db.update(users)
          .set({ mousaBalance: data.balance })
          .where(eq(users.openId, user.openId));
        console.log(`✅ Updated balance for ${user.openId}: ${data.balance}`);
      }
    } catch (e) {
      console.log(`⚠️ Could not update balance for ${user.openId}:`, e.message);
    }
  }
}

await pool.end();
console.log('\nDone!');
