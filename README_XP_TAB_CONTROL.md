# ضبط نقاط التاب

تمت مراجعة منطق النقاط في:

- `app/admin/programs/[id]/tabs/page.tsx`
- `app/api/child/progress/result/route.ts`
- `supabase/program_tabs_custom_fields.sql`

## النتيجة

- إذا كان `program_tabs.award_xp = true`:
  - نتيجة اللعبة/القصة تُحفظ.
  - يتم حساب XP.
  - يتم زيادة `profiles.xp` مرة واحدة فقط لكل محتوى.

- إذا كان `program_tabs.award_xp = false`:
  - نتيجة اللعبة/القصة تُحفظ.
  - المحتوى يُعلّم كمكتمل.
  - `xp_earned = 0`.
  - `xp_awarded = false`.
  - لا يتم تعديل `profiles.xp`.

## ملف SQL إضافي

إذا قاعدة البيانات عندك لا تحتوي أعمدة XP، نفّذ:

`supabase/xp_control_columns.sql`

أما إذا كنت نفذت سابقًا `supabase/program_tabs_custom_fields.sql` وكان عندك أعمدة `xp_earned` و `xp_awarded`، لا تحتاج شيء إضافي.
