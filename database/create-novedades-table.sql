-- =====================================================
-- SCRIPT: Crear tabla novedades en Supabase
-- DESCRIPCIÓN: Tabla para almacenar novedades y ofertas
-- FECHA: 2025-01-10
-- =====================================================

-- Crear tabla novedades
CREATE TABLE IF NOT EXISTS public.novedades (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    enlace_url TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_fin TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_novedades_activo ON public.novedades(activo);
CREATE INDEX IF NOT EXISTS idx_novedades_fecha_inicio ON public.novedades(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_novedades_fecha_fin ON public.novedades(fecha_fin);

-- Insertar novedades de ejemplo
INSERT INTO public.novedades (titulo, descripcion, imagen_url, enlace_url, activo, fecha_inicio, fecha_fin) 
VALUES 
    (
        '¡Gran Oferta de Lanzamiento!',
        'Descuentos especiales en toda la tienda para celebrar nuestro lanzamiento. No te pierdas estas increíbles ofertas.',
        'https://via.placeholder.com/800x400/667eea/ffffff?text=Oferta+Lanzamiento',
        '/productos',
        true,
        NOW(),
        NOW() + INTERVAL '30 days'
    ),
    (
        'Nuevos Productos Disponibles',
        'Descubre nuestra nueva colección de productos tecnológicos con las últimas innovaciones del mercado.',
        'https://via.placeholder.com/800x400/764ba2/ffffff?text=Nuevos+Productos',
        '/productos',
        true,
        NOW(),
        NOW() + INTERVAL '15 days'
    ),
    (
        'Envío Gratis en Compras +$50.000',
        'Aprovecha nuestro envío gratuito en todas las compras superiores a $50.000. Válido por tiempo limitado.',
        'https://via.placeholder.com/800x400/2c3e50/ffffff?text=Envio+Gratis',
        '/productos',
        true,
        NOW(),
        NOW() + INTERVAL '45 days'
    )
ON CONFLICT DO NOTHING;

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos los usuarios
CREATE POLICY "Permitir lectura de novedades a todos" ON public.novedades
    FOR SELECT USING (true);

-- Política para permitir escritura solo a administradores
CREATE POLICY "Permitir escritura de novedades solo a admins" ON public.novedades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE usuarios.id = auth.uid()::text 
            AND usuarios.rol = 'admin'
        )
    );

-- Comentarios para documentación
COMMENT ON TABLE public.novedades IS 'Tabla para almacenar novedades, ofertas y banners promocionales';
COMMENT ON COLUMN public.novedades.titulo IS 'Título de la novedad o oferta';
COMMENT ON COLUMN public.novedades.descripcion IS 'Descripción detallada de la novedad';
COMMENT ON COLUMN public.novedades.imagen_url IS 'URL de la imagen promocional';
COMMENT ON COLUMN public.novedades.enlace_url IS 'URL de destino cuando se hace clic en la novedad';
COMMENT ON COLUMN public.novedades.activo IS 'Indica si la novedad está activa y visible';
COMMENT ON COLUMN public.novedades.fecha_inicio IS 'Fecha de inicio de la promoción';
COMMENT ON COLUMN public.novedades.fecha_fin IS 'Fecha de finalización de la promoción';

-- Mostrar resultado
SELECT 
    'Tabla novedades creada exitosamente' as resultado,
    COUNT(*) as total_novedades
FROM public.novedades;
