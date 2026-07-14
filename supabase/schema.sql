-- supabase/schema.sql

-- 每日记录
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  date DATE NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('study_day', 'rest_day')),
  focus_in_class FLOAT NOT NULL DEFAULT 0,
  focus_out_class FLOAT NOT NULL DEFAULT 0,
  entertainment FLOAT NOT NULL DEFAULT 0,
  ibetter_count INT NOT NULL DEFAULT 0,
  return_count INT NOT NULL DEFAULT 0,
  progress_level TEXT CHECK (progress_level IN ('slight', 'solid', 'breakthrough')),
  progress_note TEXT,
  state_label TEXT CHECK (state_label IN ('recovering', 'steady', 'good', 'energized')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 倒计时
CREATE TABLE countdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  label TEXT NOT NULL,
  target_date DATE NOT NULL
);

-- 便签提醒
CREATE TABLE sticky_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  content TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 音频片段
CREATE TABLE audio_clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0
);

-- 专注模式背景图
CREATE TABLE focus_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  file_path TEXT NOT NULL
);

-- 专注会话（每次专注结束后即时录入）
CREATE TABLE focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL CHECK (category IN ('in_class', 'out_class', 'entertainment')),
  duration FLOAT NOT NULL CONSTRAINT focus_sessions_duration_range_check
    CHECK (duration > 0 AND duration <= 8),  -- 单位：小时
  client_session_id UUID,
  CONSTRAINT focus_sessions_user_client_session_id_key
    UNIQUE (user_id, client_session_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
 
-- 鎴愰暱杩借釜鍋忓ソ
CREATE TABLE user_growth_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_habit_checkins BOOLEAN NOT NULL DEFAULT false,
  enable_progress_tracking BOOLEAN NOT NULL DEFAULT false,
  enable_state_tracking BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
