-- Baseline du schema public (squash genere via 'supabase db dump --schema public' le 2026-06-13).
-- Remplace les 43 migrations anterieures (archivees dans supabase/_archived_migrations_pre_baseline/).
-- L'app etait construite a la main; cette baseline rend le schema reproductible (db reset / clone).




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "text" NOT NULL,
    "uid" "text",
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "password" "text",
    "role" "text" DEFAULT 'admin'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text",
    "last_login_at" timestamp with time zone
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcement_logs" (
    "id" "text" NOT NULL,
    "announcement_id" "text",
    "action" "text",
    "previous_content" "text",
    "new_content" "text",
    "previous_status" boolean,
    "new_status" boolean,
    "user_id" "text",
    "user_full_name" "text",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcement_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "text",
    "updated_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "text",
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendances" (
    "id" "text" NOT NULL,
    "soul_id" "text",
    "shepherd_id" "text",
    "date" timestamp with time zone,
    "present" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."attendances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audio_categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "order" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."audio_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audio_speakers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "church_id" "text" DEFAULT 'bergerie'::"text",
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "audio_speakers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."audio_speakers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."birthdays" (
    "id" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "soul_id" "text",
    "full_name" "text",
    "birth_date" "text",
    "phone" "text",
    "shepherd_id" "text",
    "is_sent" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text",
    CONSTRAINT "chk_birth_date_format" CHECK (("birth_date" ~ '^[0-9]{2}-[0-9]{2}$'::"text"))
);


ALTER TABLE "public"."birthdays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bug_reports" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "page_url" "text",
    "user_id" "text",
    "user_name" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text",
    CONSTRAINT "bug_reports_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "bug_reports_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."bug_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."churches" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "logo_url" "text",
    "primary_color" "text" DEFAULT '#00665C'::"text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "modules" "jsonb" DEFAULT '{"sms": true, "audio": true, "souls": true, "users": true, "servants": true, "soul_map": true, "birthdays": true, "attendance": true, "statistics": true, "departments": true, "interactions": true, "evangelization": true, "spiritual_progression": true}'::"jsonb",
    "short_name" "text",
    "copyright_name" "text",
    CONSTRAINT "churches_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."churches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "leader" "text",
    "order" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evangelized_souls" (
    "id" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "nickname" "text",
    "gender" "text",
    "phone" "text",
    "location" "text",
    "evangelization_date" timestamp with time zone,
    "evangelization_location" "text",
    "notes" "text",
    "evangelist_id" "text",
    "imported_from_evangelist_id" "text",
    "status" "text" DEFAULT 'active'::"text",
    "photo_url" "text",
    "imported_to_soul_id" "text",
    "imported_at" timestamp with time zone,
    "imported_by" "text",
    "attended_community" "text",
    "gave_life_to_jesus" "text",
    "planned_service" "text",
    "prayer_topics" "text",
    "interviewer_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "source_type" "text" DEFAULT 'manual'::"text",
    "source_id" "text",
    "original_soul_id" "text",
    "imported_from_evangelized_id" "text",
    "created_by" "text",
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."evangelized_souls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interactions" (
    "id" "text" NOT NULL,
    "soul_id" "text",
    "shepherd_id" "text",
    "type" "text",
    "date" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "source_collection" "text" DEFAULT 'souls'::"text",
    "soul_snapshot_name" "text",
    "actor_snapshot_name" "text",
    "church_id" "text" DEFAULT 'bergerie'::"text",
    CONSTRAINT "interactions_source_collection_check" CHECK (("source_collection" = ANY (ARRAY['souls'::"text", 'evangelized_souls'::"text"])))
);


ALTER TABLE "public"."interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."servants" (
    "id" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "nickname" "text",
    "gender" "text",
    "phone" "text",
    "email" "text",
    "department_id" "text",
    "is_head" boolean DEFAULT false,
    "is_shepherd" boolean DEFAULT false,
    "shepherd_id" "text",
    "source_type" "text",
    "source_id" "text",
    "original_soul_id" "text",
    "promotion_date" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."servants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_families" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "leader" "text",
    "leader_id" "text",
    "shepherd_ids" "text"[],
    "order" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."service_families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."sms_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sms_templates" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "category" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."sms_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."souls" (
    "id" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "nickname" "text",
    "gender" "text",
    "phone" "text",
    "location" "text",
    "is_undecided" boolean DEFAULT false,
    "coordinates" "jsonb",
    "first_visit_date" timestamp with time zone,
    "shepherd_id" "text",
    "evangelist_id" "text",
    "origin_source" "text",
    "service_family_id" "text",
    "spiritual_profile" "jsonb",
    "is_servant" boolean DEFAULT false,
    "servant_id" "text",
    "promotion_to_servant_date" timestamp with time zone,
    "photo_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."souls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teachings" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "speaker" "text",
    "category" "text",
    "tags" "text"[],
    "duration" integer,
    "file_url" "text",
    "thumbnail_url" "text",
    "featured" boolean DEFAULT false,
    "date" timestamp with time zone,
    "theme" "text",
    "playlist" "text",
    "plays" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text"
);


ALTER TABLE "public"."teachings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "uid" "text",
    "full_name" "text" NOT NULL,
    "nickname" "text",
    "email" "text",
    "phone" "text",
    "password" "text",
    "role" "text",
    "roles" "jsonb",
    "business_profiles" "jsonb",
    "active_profiles" "jsonb",
    "additional_menus" "text"[],
    "location" "text",
    "coordinates" "jsonb",
    "photo_url" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "church_id" "text" DEFAULT 'bergerie'::"text",
    "last_login_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcement_logs"
    ADD CONSTRAINT "announcement_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audio_categories"
    ADD CONSTRAINT "audio_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audio_speakers"
    ADD CONSTRAINT "audio_speakers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."birthdays"
    ADD CONSTRAINT "birthdays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bug_reports"
    ADD CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."churches"
    ADD CONSTRAINT "churches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."churches"
    ADD CONSTRAINT "churches_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evangelized_souls"
    ADD CONSTRAINT "evangelized_souls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."servants"
    ADD CONSTRAINT "servants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_families"
    ADD CONSTRAINT "service_families_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_categories"
    ADD CONSTRAINT "sms_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_templates"
    ADD CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."souls"
    ADD CONSTRAINT "souls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teachings"
    ADD CONSTRAINT "teachings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sms_categories"
    ADD CONSTRAINT "uq_sms_categories_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "audio_speakers_church_name_key" ON "public"."audio_speakers" USING "btree" ("church_id", "lower"("name"));



CREATE INDEX "idx_announcement_logs_announcement_id" ON "public"."announcement_logs" USING "btree" ("announcement_id");



CREATE INDEX "idx_attendances_date" ON "public"."attendances" USING "btree" ("date");



CREATE INDEX "idx_attendances_shepherd_id" ON "public"."attendances" USING "btree" ("shepherd_id");



CREATE INDEX "idx_attendances_soul_id" ON "public"."attendances" USING "btree" ("soul_id");



CREATE INDEX "idx_interactions_soul_id" ON "public"."interactions" USING "btree" ("soul_id");



CREATE INDEX "idx_souls_full_name" ON "public"."souls" USING "btree" ("full_name");



CREATE INDEX "idx_souls_shepherd_id" ON "public"."souls" USING "btree" ("shepherd_id");



CREATE INDEX "idx_souls_status" ON "public"."souls" USING "btree" ("status");



CREATE INDEX "idx_teachings_status" ON "public"."teachings" USING "btree" ("status");



CREATE INDEX "idx_users_phone" ON "public"."users" USING "btree" ("phone");



CREATE INDEX "idx_users_uid" ON "public"."users" USING "btree" ("uid");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."announcement_logs"
    ADD CONSTRAINT "announcement_logs_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."audio_categories"
    ADD CONSTRAINT "audio_categories_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."audio_speakers"
    ADD CONSTRAINT "audio_speakers_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."birthdays"
    ADD CONSTRAINT "birthdays_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."bug_reports"
    ADD CONSTRAINT "bug_reports_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."evangelized_souls"
    ADD CONSTRAINT "evangelized_souls_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "fk_attendances_soul" FOREIGN KEY ("soul_id") REFERENCES "public"."souls"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."souls"
    ADD CONSTRAINT "fk_souls_shepherd" FOREIGN KEY ("shepherd_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interactions"
    ADD CONSTRAINT "interactions_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."servants"
    ADD CONSTRAINT "servants_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."service_families"
    ADD CONSTRAINT "service_families_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."sms_categories"
    ADD CONSTRAINT "sms_categories_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."sms_templates"
    ADD CONSTRAINT "sms_templates_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."souls"
    ADD CONSTRAINT "souls_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."teachings"
    ADD CONSTRAINT "teachings_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id");



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow_delete_evangelized_souls" ON "public"."evangelized_souls" FOR DELETE USING (true);



CREATE POLICY "allow_delete_souls" ON "public"."souls" FOR DELETE USING (true);



CREATE POLICY "allow_insert_evangelized_souls" ON "public"."evangelized_souls" FOR INSERT WITH CHECK (true);



CREATE POLICY "allow_update_evangelized_souls" ON "public"."evangelized_souls" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."announcement_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anon_read_active_admins" ON "public"."admins" FOR SELECT TO "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "anon_read_active_users" ON "public"."users" FOR SELECT TO "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "anon_select_announcement_logs" ON "public"."announcement_logs" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_announcements" ON "public"."announcements" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_attendances" ON "public"."attendances" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_audio_categories" ON "public"."audio_categories" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_birthdays" ON "public"."birthdays" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_departments" ON "public"."departments" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_evangelized_souls" ON "public"."evangelized_souls" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_interactions" ON "public"."interactions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_servants" ON "public"."servants" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_service_families" ON "public"."service_families" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_sms_categories" ON "public"."sms_categories" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_sms_templates" ON "public"."sms_templates" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_souls" ON "public"."souls" FOR SELECT TO "anon" USING (true);



CREATE POLICY "anon_select_teachings" ON "public"."teachings" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audio_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audio_speakers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audio_speakers_all_operations" ON "public"."audio_speakers" USING (true) WITH CHECK (true);



CREATE POLICY "auth_read_admins" ON "public"."admins" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_read_users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_admins" ON "public"."admins" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_announcement_logs" ON "public"."announcement_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_announcements" ON "public"."announcements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_attendances" ON "public"."attendances" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_audio_categories" ON "public"."audio_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_birthdays" ON "public"."birthdays" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_departments" ON "public"."departments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_evangelized_souls" ON "public"."evangelized_souls" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_interactions" ON "public"."interactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_servants" ON "public"."servants" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_service_families" ON "public"."service_families" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_sms_categories" ON "public"."sms_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_sms_templates" ON "public"."sms_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_souls" ON "public"."souls" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_teachings" ON "public"."teachings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth_select_users" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."birthdays" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "birthdays_all_operations" ON "public"."birthdays" USING (true) WITH CHECK (true);



ALTER TABLE "public"."bug_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bug_reports_all" ON "public"."bug_reports" USING (true) WITH CHECK (true);



ALTER TABLE "public"."churches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "churches_all_operations" ON "public"."churches" USING (true) WITH CHECK (true);



ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."servants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_families" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sms_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teachings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachings_all_operations" ON "public"."teachings" USING (true) WITH CHECK (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."announcement_logs" TO "anon";
GRANT ALL ON TABLE "public"."announcement_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."announcement_logs" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."attendances" TO "anon";
GRANT ALL ON TABLE "public"."attendances" TO "authenticated";
GRANT ALL ON TABLE "public"."attendances" TO "service_role";



GRANT ALL ON TABLE "public"."audio_categories" TO "anon";
GRANT ALL ON TABLE "public"."audio_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."audio_categories" TO "service_role";



GRANT ALL ON TABLE "public"."audio_speakers" TO "anon";
GRANT ALL ON TABLE "public"."audio_speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."audio_speakers" TO "service_role";



GRANT ALL ON TABLE "public"."birthdays" TO "anon";
GRANT ALL ON TABLE "public"."birthdays" TO "authenticated";
GRANT ALL ON TABLE "public"."birthdays" TO "service_role";



GRANT ALL ON TABLE "public"."bug_reports" TO "anon";
GRANT ALL ON TABLE "public"."bug_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."bug_reports" TO "service_role";



GRANT ALL ON TABLE "public"."churches" TO "anon";
GRANT ALL ON TABLE "public"."churches" TO "authenticated";
GRANT ALL ON TABLE "public"."churches" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."evangelized_souls" TO "anon";
GRANT ALL ON TABLE "public"."evangelized_souls" TO "authenticated";
GRANT ALL ON TABLE "public"."evangelized_souls" TO "service_role";



GRANT ALL ON TABLE "public"."interactions" TO "anon";
GRANT ALL ON TABLE "public"."interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."interactions" TO "service_role";



GRANT ALL ON TABLE "public"."servants" TO "anon";
GRANT ALL ON TABLE "public"."servants" TO "authenticated";
GRANT ALL ON TABLE "public"."servants" TO "service_role";



GRANT ALL ON TABLE "public"."service_families" TO "anon";
GRANT ALL ON TABLE "public"."service_families" TO "authenticated";
GRANT ALL ON TABLE "public"."service_families" TO "service_role";



GRANT ALL ON TABLE "public"."sms_categories" TO "anon";
GRANT ALL ON TABLE "public"."sms_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_categories" TO "service_role";



GRANT ALL ON TABLE "public"."sms_templates" TO "anon";
GRANT ALL ON TABLE "public"."sms_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."sms_templates" TO "service_role";



GRANT ALL ON TABLE "public"."souls" TO "anon";
GRANT ALL ON TABLE "public"."souls" TO "authenticated";
GRANT ALL ON TABLE "public"."souls" TO "service_role";



GRANT ALL ON TABLE "public"."teachings" TO "anon";
GRANT ALL ON TABLE "public"."teachings" TO "authenticated";
GRANT ALL ON TABLE "public"."teachings" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







