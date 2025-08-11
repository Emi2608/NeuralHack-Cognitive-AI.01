-- =====================================================
-- Test Database Connection and Profile Creation
-- =====================================================
-- Script para probar la conexión y funciones de la base de datos
-- =====================================================

-- Test 1: Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'audit_logs', 'user_consents')
ORDER BY tablename;

-- Test 2: Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Test 3: Check audit_logs table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Test 4: Check constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
   OR conrelid = 'public.audit_logs'::regclass;

-- Test 5: Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'audit_logs')
ORDER BY tablename, indexname;

-- Test 6: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'audit_logs')
ORDER BY tablename, policyname;

-- Test 7: Test the complete_user_registration function
SELECT complete_user_registration(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@example.com',
  '1980-01-01'::date,
  12,
  'es'
);

-- Test 8: Check recent audit logs (last 10)
SELECT 
  action,
  resource_type,
  user_id,
  created_at,
  metadata->>'unique_id' as unique_id
FROM public.audit_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Test 9: Check for duplicate audit logs
SELECT 
  user_id,
  action,
  resource_type,
  DATE_TRUNC('second', created_at) as created_second,
  COUNT(*) as duplicate_count
FROM public.audit_logs 
GROUP BY user_id, action, resource_type, DATE_TRUNC('second', created_at)
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Test 10: Check profiles count
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN consent_given = true THEN 1 END) as consented_profiles,
  COUNT(CASE WHEN date_of_birth IS NOT NULL THEN 1 END) as profiles_with_dob
FROM public.profiles;