-- Migration: 0024_drop_center_reports.sql
-- Description: Drop deprecated center_reports table and policies without CASCADE.
-- Part of cleanup following Centers Tracker module removal.

BEGIN;

-- 1. Drop associated RLS policies in dependency order
DROP POLICY IF EXISTS "center_reports: admin all" ON public.center_reports;
DROP POLICY IF EXISTS "center_reports: authenticated insert" ON public.center_reports;
DROP POLICY IF EXISTS "center_reports: public read" ON public.center_reports;

-- 2. Drop table WITHOUT CASCADE (fails loudly if unexpected dependencies exist)
DROP TABLE IF EXISTS public.center_reports;

COMMIT;

