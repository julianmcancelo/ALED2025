-- =====================================================
-- SCRIPT: Crear tabla configuracion en Supabase
-- DESCRIPCIÓN: Tabla para almacenar configuración del sitio
-- FECHA: 2025-01-10
-- =====================================================

-- Crear tabla configuracion
CREATE TABLE IF NOT EXISTS public.configuracion (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255),
    subtitulo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por clave
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON public.configuracion(clave);

-- Insertar configuración por defecto
INSERT INTO public.configuracion (clave, titulo, subtitulo) 
VALUES (
    'sitio',
    'ALED2025 - E-commerce',
    'Proyecto desarrollado con Angular y Supabase por Cancelo Julian & Nicolas Otero'
) ON CONFLICT (clave) DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios autenticados y anónimos
CREATE POLICY "Permitir lectura de configuración a todos" ON public.configuracion
    FOR SELECT USING (true);

-- Política para permitir escritura solo a administradores
CREATE POLICY "Permitir escritura de configuración solo a admins" ON public.configuracion
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE usuarios.id = auth.uid()::text 
            AND usuarios.rol = 'admin'
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE public.configuracion IS 'Tabla para almacenar la configuración global del sitio web';
COMMENT ON COLUMN public.configuracion.clave IS 'Clave única para identificar el tipo de configuración';
COMMENT ON COLUMN public.configuracion.titulo IS 'Título principal del sitio';
COMMENT ON COLUMN public.configuracion.subtitulo IS 'Subtítulo o descripción del sitio';

-- Mostrar resultado
SELECT 'Tabla configuracion creada exitosamente' as resultado;
