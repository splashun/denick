-- ============================================================
-- schema.sql – "denick" database schema courtesy of Claude
-- ============================================================

-- 1. Table
CREATE TABLE IF NOT EXISTS nicks (
  nickname   VARCHAR(16)   PRIMARY KEY,
  real_name  VARCHAR(16)   NOT NULL,
  real_uuid  VARCHAR(36)   NOT NULL,
  updated_at TIMESTAMPTZ   DEFAULT NOW()
);

-- 2. Index for lookups by UUID
CREATE INDEX IF NOT EXISTS idx_nicks_real_uuid ON nicks (real_uuid);

-- 3. Trigger function – pushes changed nicknames to pg_notify
CREATE OR REPLACE FUNCTION notify_nick_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM pg_notify('nick_updates', OLD.nickname);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM pg_notify('nick_updates', OLD.nickname);
    RETURN NEW;
  END IF;

  -- INSERT
  RETURN NEW;
END;
$$;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trg_nick_change ON nicks;
CREATE TRIGGER trg_nick_change
  AFTER INSERT OR UPDATE OR DELETE ON nicks
  FOR EACH ROW
  EXECUTE FUNCTION notify_nick_change();
  