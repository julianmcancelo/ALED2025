-- =====================================================
-- SCRIPT DE PRODUCCIÓN: Políticas de Storage Seguras para ALED2025
-- DESCRIPCIÓN: Configuración de seguridad robusta para producción
-- FECHA: 2025-01-10
-- 🔒 SOLO PARA PRODUCCIÓN - SEGURIDAD MÁXIMA
-- =====================================================

-- 1. CREAR BUCKET CON CONFIGURACIÓN DE PRODUCCIÓN
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'productos-imagenes',
    'productos-imagenes',
    true, -- Público para que las imágenes sean accesibles
    10485760, -- 10MB límite (más restrictivo que desarrollo)
    ARRAY['image/jpeg', 'image/png', 'image/webp'] -- Solo formatos optimizados
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. HABILITAR RLS Y ELIMINAR POLÍTICAS EXISTENTES
-- =====================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir subida de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir eliminación de imágenes" ON storage.objects;

-- 3. POLÍTICAS DE SEGURIDAD PARA PRODUCCIÓN
-- =====================================================

-- 📖 LECTURA PÚBLICA: Cualquiera puede ver las imágenes de productos
CREATE POLICY "Lectura pública de imágenes de productos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'productos-imagenes'
    );

-- 📤 SUBIDA RESTRINGIDA: Solo usuarios autenticados pueden subir
CREATE POLICY "Subida solo para usuarios autenticados" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'productos-imagenes' AND
        auth.uid() IS NOT NULL AND
        -- Verificar que el usuario existe en la tabla usuarios
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text 
            AND activo = true
        )
    );

-- ✏️ ACTUALIZACIÓN RESTRINGIDA: Solo admins pueden actualizar
CREATE POLICY "Actualización solo para administradores" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'productos-imagenes' AND
        auth.uid() IS NOT NULL AND
        -- Solo usuarios con rol admin
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text 
            AND rol = 'admin' 
            AND activo = true
        )
    );

-- 🗑️ ELIMINACIÓN RESTRINGIDA: Solo admins pueden eliminar
CREATE POLICY "Eliminación solo para administradores" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'productos-imagenes' AND
        auth.uid() IS NOT NULL AND
        -- Solo usuarios con rol admin
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id::text = auth.uid()::text 
            AND rol = 'admin' 
            AND activo = true
        )
    );

-- 4. CREAR FUNCIÓN PARA VALIDAR ARCHIVOS
-- =====================================================
CREATE OR REPLACE FUNCTION validate_file_upload()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar tamaño de archivo (10MB máximo)
    IF NEW.metadata->>'size' IS NOT NULL AND 
       (NEW.metadata->>'size')::bigint > 10485760 THEN
        RAISE EXCEPTION 'Archivo demasiado grande. Máximo 10MB permitido.';
    END IF;
    
    -- Validar tipo de archivo
    IF NEW.metadata->>'mimetype' IS NOT NULL AND
       NEW.metadata->>'mimetype' NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
        RAISE EXCEPTION 'Tipo de archivo no permitido. Solo JPEG, PNG y WebP.';
    END IF;
    
    -- Validar estructura de carpetas
    IF NEW.name IS NOT NULL AND
       NEW.name !~ '^productos/[0-9]+_[a-z0-9_-]+\.(jpg|jpeg|png|webp)$' THEN
        RAISE EXCEPTION 'Nombre de archivo no válido. Use el formato: productos/timestamp_nombre.ext';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de validación
DROP TRIGGER IF EXISTS validate_file_upload_trigger ON storage.objects;
CREATE TRIGGER validate_file_upload_trigger
    BEFORE INSERT OR UPDATE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION validate_file_upload();

-- 5. CREAR POLÍTICAS ADICIONALES DE SEGURIDAD
-- =====================================================

-- Limitar número de archivos por usuario
CREATE POLICY "Límite de archivos por usuario" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'productos-imagenes' AND
        -- Máximo 100 archivos por usuario
        (SELECT COUNT(*) FROM storage.objects 
         WHERE bucket_id = 'productos-imagenes' 
         AND owner = auth.uid()) < 100
    );

-- 6. CONFIGURAR AUDITORÍA Y LOGGING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.storage_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    bucket_id VARCHAR(100) NOT NULL,
    object_name TEXT NOT NULL,
    object_size BIGINT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función de auditoría
CREATE OR REPLACE FUNCTION audit_storage_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.storage_audit_log (
        user_id, action, bucket_id, object_name, object_size
    ) VALUES (
        auth.uid(),
        TG_OP,
        COALESCE(NEW.bucket_id, OLD.bucket_id),
        COALESCE(NEW.name, OLD.name),
        CASE WHEN NEW.metadata IS NOT NULL 
             THEN (NEW.metadata->>'size')::bigint 
             ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de auditoría
DROP TRIGGER IF EXISTS audit_storage_trigger ON storage.objects;
CREATE TRIGGER audit_storage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION audit_storage_action();

-- 7. CONFIGURAR LÍMITES DE RATE LIMITING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.upload_rate_limit (
    user_id UUID PRIMARY KEY,
    upload_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Función para verificar rate limiting
CREATE OR REPLACE FUNCTION check_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Obtener contador actual
    SELECT upload_count, upload_rate_limit.window_start 
    INTO current_count, window_start
    FROM public.upload_rate_limit 
    WHERE user_id = auth.uid();
    
    -- Si no existe registro, crearlo
    IF current_count IS NULL THEN
        INSERT INTO public.upload_rate_limit (user_id, upload_count, window_start)
        VALUES (auth.uid(), 1, NOW());
        RETURN NEW;
    END IF;
    
    -- Resetear contador si ha pasado 1 hora
    IF window_start < NOW() - INTERVAL '1 hour' THEN
        UPDATE public.upload_rate_limit 
        SET upload_count = 1, window_start = NOW()
        WHERE user_id = auth.uid();
        RETURN NEW;
    END IF;
    
    -- Verificar límite (máximo 50 uploads por hora)
    IF current_count >= 50 THEN
        RAISE EXCEPTION 'Límite de uploads excedido. Máximo 50 archivos por hora.';
    END IF;
    
    -- Incrementar contador
    UPDATE public.upload_rate_limit 
    SET upload_count = upload_count + 1
    WHERE user_id = auth.uid();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de rate limiting
DROP TRIGGER IF EXISTS upload_rate_limit_trigger ON storage.objects;
CREATE TRIGGER upload_rate_limit_trigger
    BEFORE INSERT ON storage.objects
    FOR EACH ROW
    WHEN (NEW.bucket_id = 'productos-imagenes')
    EXECUTE FUNCTION check_upload_rate_limit();

-- 8. VERIFICAR CONFIGURACIÓN DE PRODUCCIÓN
-- =====================================================
SELECT 
    'CONFIGURACIÓN DE PRODUCCIÓN APLICADA' as resultado,
    (SELECT COUNT(*) FROM storage.buckets WHERE id = 'productos-imagenes') as bucket_existe,
    (SELECT public FROM storage.buckets WHERE id = 'productos-imagenes') as es_publico,
    (SELECT file_size_limit FROM storage.buckets WHERE id = 'productos-imagenes') as limite_tamaño,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') as politicas_creadas;

-- 9. MOSTRAR POLÍTICAS ACTIVAS
-- =====================================================
SELECT 
    policyname as "Política",
    cmd as "Comando",
    permissive as "Permisiva",
    CASE 
        WHEN cmd = 'SELECT' THEN '📖 Lectura'
        WHEN cmd = 'INSERT' THEN '📤 Subida'
        WHEN cmd = 'UPDATE' THEN '✏️ Actualización'
        WHEN cmd = 'DELETE' THEN '🗑️ Eliminación'
        ELSE cmd
    END as "Tipo"
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%productos%'
ORDER BY cmd;

-- =====================================================
-- CONFIGURACIÓN ADICIONAL RECOMENDADA PARA PRODUCCIÓN:
-- =====================================================

-- 🔒 CONFIGURACIÓN DE SEGURIDAD ADICIONAL:
-- 1. Configurar CORS en Supabase Dashboard
-- 2. Habilitar SSL/TLS certificates
-- 3. Configurar backup automático del bucket
-- 4. Monitoreo de uso y alertas
-- 5. Configurar CDN (Cloudflare) para mejor performance

-- 📊 MONITOREO RECOMENDADO:
-- 1. Alertas por uploads excesivos
-- 2. Monitoreo de tamaño del bucket
-- 3. Logs de acceso y errores
-- 4. Métricas de performance

-- 🛡️ SEGURIDAD ADICIONAL:
-- 1. Escaneo de malware en archivos subidos
-- 2. Watermarking automático de imágenes
-- 3. Compresión automática de imágenes
-- 4. Validación de contenido con IA

-- =====================================================
