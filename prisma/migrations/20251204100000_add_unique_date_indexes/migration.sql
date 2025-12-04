-- Enforce a single record per date for photo stats and steps data
DO $$
BEGIN
    ALTER TABLE "PhotoStats" ADD CONSTRAINT "PhotoStats_date_key" UNIQUE ("date");
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
    ALTER TABLE "StepsData" ADD CONSTRAINT "StepsData_date_key" UNIQUE ("date");
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;
