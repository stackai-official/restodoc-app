CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  address text NOT NULL,
  loss_type text NOT NULL, -- 'water' | 'fire' | 'mold' | 'other'
  status text NOT NULL DEFAULT 'active', -- 'active' | 'drying' | 'complete'
  claim_number text,
  insurance_company text,
  adjuster_name text,
  adjuster_phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  floor_level text DEFAULT 'main', -- 'basement' | 'main' | 'upper'
  sqft numeric,
  affected boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'photo' | 'video' | 'note'
  url text,
  thumbnail_url text,
  caption text,
  ai_description text,
  note_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE moisture_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  reading_date date NOT NULL DEFAULT CURRENT_DATE,
  location_label text NOT NULL,
  material text NOT NULL, -- 'drywall' | 'wood' | 'concrete' | 'carpet' | 'other'
  reading_value numeric NOT NULL,
  reading_type text DEFAULT 'moisture', -- 'moisture' | 'humidity' | 'temp'
  is_goal_met boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE equipment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  equipment_type text NOT NULL, -- 'dehumidifier' | 'air_mover' | 'hepa_air_scrubber' | 'other'
  brand_model text,
  quantity integer DEFAULT 1,
  serial_numbers text,
  placed_date date NOT NULL DEFAULT CURRENT_DATE,
  removed_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE floor_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  canvas_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  preview_text text,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE moisture_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS policies (users only see their own jobs and related data)
CREATE POLICY "Users own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Job rooms" ON rooms FOR ALL USING (job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid()));
CREATE POLICY "Job media" ON media FOR ALL USING (job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid()));
CREATE POLICY "Job moisture" ON moisture_readings FOR ALL USING (job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid()));
CREATE POLICY "Job equipment" ON equipment_log FOR ALL USING (job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid()));
CREATE POLICY "Job floor plans" ON floor_plans FOR ALL USING (job_id IN (SELECT id FROM jobs WHERE user_id = auth.uid()));
CREATE POLICY "User reports" ON reports FOR ALL USING (auth.uid() = user_id);
