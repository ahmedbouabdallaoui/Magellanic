CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_expert BOOLEAN DEFAULT false,
  location_lat FLOAT,
  location_lng FLOAT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE constellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  iau_code TEXT NOT NULL,
  mythology TEXT,
  discoverer TEXT,
  discovery_year INTEGER,
  visibility_seasons TEXT[],
  visibility_hemispheres TEXT[],
  star_count INTEGER,
  brightest_star TEXT,
  distance_ly FLOAT,
  stars_data JSONB,
  connections JSONB,
  bounding_sphere JSONB,
  discovery_badge_url TEXT,
  discovery_badge_caption TEXT,
  mastery_badge_url TEXT,
  mastery_badge_caption TEXT
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  constellation_id UUID REFERENCES constellations(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  constellation_id UUID REFERENCES constellations(id) ON DELETE CASCADE,
  discovered BOOLEAN DEFAULT false,
  drawn BOOLEAN DEFAULT false,
  bookmarked BOOLEAN DEFAULT false,
  discovered_at TIMESTAMPTZ,
  drawn_at TIMESTAMPTZ,
  UNIQUE (user_id, constellation_id)
);

CREATE TABLE milestone_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  criteria JSONB NOT NULL
);

CREATE TABLE user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestone_achievements(id) ON DELETE CASCADE,
  UNIQUE (user_id, milestone_id)
);
