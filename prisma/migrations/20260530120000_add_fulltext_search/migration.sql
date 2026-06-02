-- Add tsvector columns and GIN indexes for full-text search
-- Student
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Student" SET search_vector = to_tsvector('english', coalesce(name,'') || ' ' || coalesce(surname,'') || ' ' || coalesce(username,'') || ' ' || coalesce(email,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_student_search_vector') THEN
    CREATE INDEX idx_student_search_vector ON "Student" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_student') THEN
    CREATE TRIGGER tsvectorupdate_student BEFORE INSERT OR UPDATE ON "Student" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'name', 'surname', 'username', 'email');
  END IF;
END$$;

-- Teacher
ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Teacher" SET search_vector = to_tsvector('english', coalesce(name,'') || ' ' || coalesce(surname,'') || ' ' || coalesce(username,'') || ' ' || coalesce(email,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_teacher_search_vector') THEN
    CREATE INDEX idx_teacher_search_vector ON "Teacher" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_teacher') THEN
    CREATE TRIGGER tsvectorupdate_teacher BEFORE INSERT OR UPDATE ON "Teacher" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'name', 'surname', 'username', 'email');
  END IF;
END$$;

-- Parent
ALTER TABLE "Parent" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Parent" SET search_vector = to_tsvector('english', coalesce(name,'') || ' ' || coalesce(surname,'') || ' ' || coalesce(username,'') || ' ' || coalesce(email,'') || ' ' || coalesce(phone,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_parent_search_vector') THEN
    CREATE INDEX idx_parent_search_vector ON "Parent" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_parent') THEN
    CREATE TRIGGER tsvectorupdate_parent BEFORE INSERT OR UPDATE ON "Parent" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'name', 'surname', 'username', 'email', 'phone');
  END IF;
END$$;

-- Announcement
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Announcement" SET search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_announcement_search_vector') THEN
    CREATE INDEX idx_announcement_search_vector ON "Announcement" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_announcement') THEN
    CREATE TRIGGER tsvectorupdate_announcement BEFORE INSERT OR UPDATE ON "Announcement" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'title', 'description');
  END IF;
END$$;

-- Book
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Book" SET search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce("supplierName",''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_book_search_vector') THEN
    CREATE INDEX idx_book_search_vector ON "Book" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_book') THEN
    CREATE TRIGGER tsvectorupdate_book BEFORE INSERT OR UPDATE ON "Book" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'title', 'supplierName');
  END IF;
END$$;

-- Event
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Event" SET search_vector = to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_event_search_vector') THEN
    CREATE INDEX idx_event_search_vector ON "Event" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_event') THEN
    CREATE TRIGGER tsvectorupdate_event BEFORE INSERT OR UPDATE ON "Event" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'title', 'description');
  END IF;
END$$;

-- Class
ALTER TABLE "Class" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Class" SET search_vector = to_tsvector('english', coalesce(name,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_class_search_vector') THEN
    CREATE INDEX idx_class_search_vector ON "Class" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_class') THEN
    CREATE TRIGGER tsvectorupdate_class BEFORE INSERT OR UPDATE ON "Class" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'name');
  END IF;
END$$;

-- Message (text)
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS search_vector tsvector;
UPDATE "Message" SET search_vector = to_tsvector('english', coalesce(text,''));
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_message_search_vector') THEN
    CREATE INDEX idx_message_search_vector ON "Message" USING GIN (search_vector);
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tsvectorupdate_message') THEN
    CREATE TRIGGER tsvectorupdate_message BEFORE INSERT OR UPDATE ON "Message" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(search_vector, 'pg_catalog.english', 'text');
  END IF;
END$$;
