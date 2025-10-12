-- =====================================================
-- SCRIPT ALTERNATIVO: Deshabilitar RLS para Storage (DESARROLLO)
-- DESCRIPCIÓN: Deshabilita RLS completamente para evitar errores
-- FECHA: 2025-01-10
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
-- =====================================================

-- 1. CREAR BUCKET SI NO EXISTE
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos-imagenes',
    'productos-imagenes',
    true,
    52428800, -- 50MB límite
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. DESHABILITAR RLS COMPLETAMENTE (SOLO DESARROLLO)
-- =====================================================
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================
DROP POLICY IF EXISTS "Permitir subida de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes" ON storage.objects;

-- 4. VERIFICAR ESTADO
-- =====================================================
SELECT 
    'RLS DESHABILITADO PARA DESARROLLO' as resultado,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'productos-imagenes') as bucket_existe,
    (SELECT public FROM storage.buckets WHERE id = 'productos-imagenes') as es_publico,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')) as rls_habilitado;

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecutar este script SOLO en desarrollo
-- 2. Para producción, usar fix-storage-policies.sql
-- 3. Verificar que bucket aparezca en Storage > Buckets
-- 4. Probar subida de imagen desde la aplicación
-- =====================================================
