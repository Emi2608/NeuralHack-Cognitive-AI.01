-- Debug script para verificar el flujo de autenticación
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar configuración de autenticación
SELECT 
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verificar perfiles de usuario
SELECT 
  p.id,
  p.email,
  p.consent_given,
  p.created_at,
  u.email_confirmed_at,
  u.created_at as auth_created_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 3. Verificar configuración de confirmación de email
-- (Esto debe ejecutarse como superusuario)
-- SELECT * FROM auth.config;

-- 4. Limpiar usuarios de prueba (CUIDADO - solo para desarrollo)
-- DELETE FROM auth.users WHERE email LIKE '%test%' OR email LIKE '%ejemplo%';
-- DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%ejemplo%';

-- 5. Crear usuario de prueba para debugging
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@neuralhack.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Nota: Este script es solo para debugging. 
-- En producción, los usuarios deben registrarse a través de la aplicación.