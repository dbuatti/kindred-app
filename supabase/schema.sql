-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create people table
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_year TEXT,
  birth_place TEXT,
  occupation TEXT,
  vibe_sentence TEXT NOT NULL,
  personality_tags TEXT[] DEFAULT '{}',
  photo_url TEXT,
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'voice', 'photo')),
  created_by_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  voice_url TEXT,
  image_url TEXT
);

-- Create suggestions table
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  suggested_value TEXT NOT NULL,
  suggested_by_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies (Simplified for family access)
CREATE POLICY "Allow public read access" ON families FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON families FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON people FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON people FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON people FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON memories FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON memories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON suggestions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON suggestions FOR UPDATE USING (true);