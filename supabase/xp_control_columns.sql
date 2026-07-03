-- نفّذ هذا الملف مرة واحدة فقط إذا لم تكن الأعمدة موجودة عندك.
-- الهدف: ضمان أن التاب الذي award_xp=true يمنح نقاط، والذي award_xp=false لا يمنح نقاط.

alter table public.program_tabs
  add column if not exists award_xp boolean not null default true;

alter table public.child_content_progress
  add column if not exists xp_earned integer not null default 0,
  add column if not exists xp_awarded boolean not null default false;

comment on column public.program_tabs.award_xp is 'إذا كانت true يحصل الطفل على نقاط من محتوى هذا التاب، وإذا false يكون التاب تعليمي فقط بدون نقاط';
comment on column public.child_content_progress.xp_earned is 'عدد نقاط XP المكتسبة من هذا المحتوى';
comment on column public.child_content_progress.xp_awarded is 'هل تم احتساب XP فعلي لهذا المحتوى';
