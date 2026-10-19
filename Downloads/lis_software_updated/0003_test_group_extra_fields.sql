-- ============================================================================
-- Adds the Test Master fields the app's UI now has (per the current
-- TestMaster.tsx / db.ts) but that were not in the original 0001 schema:
-- department, specimen type, container, sample volume, report sequence on
-- test_groups; analyzer code, critical ranges, report comment, is_required
-- on test_parameters.
--
-- Safe to run whether or not your live database already has some/all of
-- these — IF NOT EXISTS means nothing is touched if a column is already
-- there, and nothing is dropped or renamed.
-- ============================================================================

alter table test_groups
  add column if not exists department text not null default '',
  add column if not exists specimen_type text,
  add column if not exists sample_volume text,
  add column if not exists container_type text,
  add column if not exists report_sequence int not null default 0;

alter table test_parameters
  add column if not exists analyzer_code text,
  add column if not exists critical_low numeric(10,3),
  add column if not exists critical_high numeric(10,3),
  add column if not exists report_comment text,
  add column if not exists is_required boolean not null default true;
