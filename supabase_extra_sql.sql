
-- 이미 study_goals를 만들었다면 이 SQL은 month_goals만 추가로 실행하면 됩니다.

create table if not exists month_goals (
  id bigint generated always as identity primary key,
  user_name text not null unique,
  goal_text text default '',
  created_at timestamp default now()
);

-- study_goals 테이블을 UI로 만들었다면 RLS가 꺼져있는지 확인하세요.
-- RLS가 켜져 있으면 지금 코드에서 저장/조회가 막힐 수 있습니다.
