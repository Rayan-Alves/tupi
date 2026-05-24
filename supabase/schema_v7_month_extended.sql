-- Migration v7: Extended month dashboard
-- New columns in month_profile + new tables

-- ── month_profile: new fields ──────────────────────────────────────
ALTER TABLE month_profile
  ADD COLUMN IF NOT EXISTS palavra_do_mes  TEXT,
  ADD COLUMN IF NOT EXISTS o_que_traz      TEXT,
  ADD COLUMN IF NOT EXISTS pilar_corpo     TEXT,
  ADD COLUMN IF NOT EXISTS pilar_mente     TEXT,
  ADD COLUMN IF NOT EXISTS pilar_espirito  TEXT;

-- ── month_bills ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS month_bills (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period        TEXT NOT NULL,           -- e.g. '2026-05'
  title         TEXT NOT NULL DEFAULT '',
  day_of_month  INT,                     -- 1-31
  recurring     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE month_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own bills" ON month_bills
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS month_bills_user_period ON month_bills(user_id, period);

-- ── month_health ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS month_health (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE month_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own health" ON month_health
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS month_health_user_period ON month_health(user_id, period);

-- ── month_largar ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS month_largar (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE month_largar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own largar" ON month_largar
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS month_largar_user_period ON month_largar(user_id, period);
