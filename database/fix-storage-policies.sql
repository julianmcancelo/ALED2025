-- =====================================================
-- SCRIPT: Configurar Storage y Políticas RLS para ALED2025
-- DESCRIPCIÓN: Crear bucket y políticas para subida de imágenes
-- FECHA: 2025-01-10
-- =====================================================

-- 1. CREAR BUCKET PARA PRODUCTOS (si no existe)
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

-- 2. ELIMINAR POLÍTICAS EXISTENTES (si las hay)
-- =====================================================
DROP POLICY IF EXISTS "Permitir subida de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes" ON storage.objects;

-- 3. CREAR POLÍTICAS PERMISIVAS PARA DESARROLLO
-- =====================================================

-- Política para permitir subida de archivos (INSERT) - MUY PERMISIVA
CREATE POLICY "Permitir subida de imágenes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'productos-imagenes' AND
        (auth.uid() IS NOT NULL OR true) -- Permitir incluso sin autenticación
    );

-- Política para permitir lectura pública (SELECT)
CREATE POLICY "Permitir lectura pública" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'productos-imagenes'
    );

-- Política para permitir actualización (UPDATE)
CREATE POLICY "Permitir actualización de imágenes" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'productos-imagenes' AND
        (auth.uid() IS NOT NULL OR true)
    );

-- Política para permitir eliminación (DELETE)
CREATE POLICY "Permitir eliminación de imágenes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'productos-imagenes' AND
        (auth.uid() IS NOT NULL OR true)
    );

-- 4. VERIFICAR CONFIGURACIÓN
-- =====================================================
SELECT 
    'STORAGE CONFIGURADO EXITOSAMENTE' as resultado,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'productos-imagenes') as bucket_existe,
    (SELECT public FROM storage.buckets WHERE id = 'productos-imagenes') as es_publico,
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'productos-imagenes') as limite_tamaño;

-- 5. MOSTRAR POLÍTICAS CREADAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- INSTRUCCIONES ADICIONALES:
-- =====================================================
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Verificar que el bucket aparezca en Storage > Buckets
-- 3. Probar subida de imagen desde la aplicación
-- 4. Si persisten errores, revisar logs en Supabase Dashboard
-- =====================================================
