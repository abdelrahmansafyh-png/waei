-- نفّذ هذا الملف مرة واحدة في Supabase SQL Editor
-- لإضافة تحكم نص التعليمات ونظام نقاط التاب.

alter table public.program_tabs
  add column if not exists guide_title text,
  add column if not exists guide_description text,
  add column if not exists award_xp boolean not null default true;

comment on column public.program_tabs.guide_title is 'عنوان صندوق التعليمات داخل التاب مثل: تابع القصص بالترتيب';
comment on column public.program_tabs.guide_description is 'الوصف أسفل عنوان صندوق التعليمات داخل التاب';
comment on column public.program_tabs.award_xp is 'إذا كانت true يحصل الطفل على نقاط من ألعاب/قصص هذا التاب، وإذا false يكون التاب تعليمي فقط بدون نقاط';
