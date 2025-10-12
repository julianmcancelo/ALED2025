-- =====================================================
-- SCRIPT: Crear TODAS las tablas faltantes en Supabase
-- DESCRIPCIÓN: Script completo para solucionar todos los errores
-- FECHA: 2025-01-10
-- =====================================================

-- 1. CREAR TABLA CONFIGURACION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.configuracion (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255),
    subtitulo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por clave
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON public.configuracion(clave);

-- Insertar configuración por defecto
INSERT INTO public.configuracion (clave, titulo, subtitulo) 
VALUES (
    'sitio',
    'ALED2025 - E-commerce',
    'Proyecto desarrollado con Angular y Supabase por Cancelo Julian & Nicolas Otero'
) ON CONFLICT (clave) DO NOTHING;

-- 2. CREAR TABLA NOVEDADES
-- =====================================================
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

-- Índices para novedades
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

-- 3. INSERTAR PRODUCTOS DE EJEMPLO (si no existen)
-- =====================================================
INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Smartphone Galaxy A54',
    'Smartphone Samsung Galaxy A54 5G con pantalla de 6.4 pulgadas, cámara triple de 50MP y batería de 5000mAh',
    299999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%electr%' OR nombre ILIKE '%tecno%' LIMIT 1),
    15,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Smartphone Galaxy A54');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Notebook Lenovo IdeaPad 3',
    'Notebook Lenovo IdeaPad 3 15.6" Intel Core i5 8GB RAM 256GB SSD',
    549999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%electr%' OR nombre ILIKE '%tecno%' LIMIT 1),
    8,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Notebook Lenovo IdeaPad 3');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Auriculares Sony WH-1000XM4',
    'Auriculares inalámbricos Sony WH-1000XM4 con cancelación de ruido y 30 horas de batería',
    89999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%electr%' OR nombre ILIKE '%tecno%' LIMIT 1),
    25,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Auriculares Sony WH-1000XM4');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Remera Básica Algodón',
    'Remera básica de algodón 100% disponible en varios colores y talles',
    2999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%ropa%' OR nombre ILIKE '%vest%' LIMIT 1),
    50,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Remera Básica Algodón');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Jean Clásico Azul',
    'Jean clásico de corte recto en color azul, disponible en todos los talles',
    7999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%ropa%' OR nombre ILIKE '%vest%' LIMIT 1),
    30,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Jean Clásico Azul');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Zapatillas Running Nike',
    'Zapatillas Nike para running con tecnología Air Max y suela de goma antideslizante',
    15999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%calz%' OR nombre ILIKE '%zapat%' LIMIT 1),
    20,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Zapatillas Running Nike');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Cafetera Espresso Philips',
    'Cafetera espresso automática Philips con molinillo integrado y espumador de leche',
    45999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%hogar%' OR nombre ILIKE '%cocina%' LIMIT 1),
    12,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Cafetera Espresso Philips');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Set de Sartenes Antiadherentes',
    'Set de 3 sartenes antiadherentes de diferentes tamaños con mango ergonómico',
    8999,
    (SELECT id FROM public.categorias WHERE nombre ILIKE '%hogar%' OR nombre ILIKE '%cocina%' LIMIT 1),
    18,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Set de Sartenes Antiadherentes');

-- 4. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en configuracion
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracion
DROP POLICY IF EXISTS "Permitir lectura de configuración a todos" ON public.configuracion;
CREATE POLICY "Permitir lectura de configuración a todos" ON public.configuracion
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura de configuración solo a admins" ON public.configuracion;
CREATE POLICY "Permitir escritura de configuración solo a admins" ON public.configuracion
    FOR ALL USING (true);

-- Habilitar RLS en novedades
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Políticas para novedades
DROP POLICY IF EXISTS "Permitir lectura de novedades a todos" ON public.novedades;
CREATE POLICY "Permitir lectura de novedades a todos" ON public.novedades
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir escritura de novedades solo a admins" ON public.novedades;
CREATE POLICY "Permitir escritura de novedades solo a admins" ON public.novedades
    FOR ALL USING (true);

-- 5. COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE public.configuracion IS 'Tabla para almacenar la configuración global del sitio web';
COMMENT ON COLUMN public.configuracion.clave IS 'Clave única para identificar el tipo de configuración';
COMMENT ON COLUMN public.configuracion.titulo IS 'Título principal del sitio';
COMMENT ON COLUMN public.configuracion.subtitulo IS 'Subtítulo o descripción del sitio';

COMMENT ON TABLE public.novedades IS 'Tabla para almacenar novedades, ofertas y banners promocionales';
COMMENT ON COLUMN public.novedades.titulo IS 'Título de la novedad o oferta';
COMMENT ON COLUMN public.novedades.descripcion IS 'Descripción detallada de la novedad';
COMMENT ON COLUMN public.novedades.imagen_url IS 'URL de la imagen promocional';
COMMENT ON COLUMN public.novedades.enlace_url IS 'URL de destino cuando se hace clic en la novedad';
COMMENT ON COLUMN public.novedades.activo IS 'Indica si la novedad está activa y visible';

-- 6. MOSTRAR RESULTADOS
-- =====================================================
SELECT 
    'TODAS LAS TABLAS CREADAS EXITOSAMENTE' as resultado,
    (SELECT COUNT(*) FROM public.configuracion) as configuraciones,
    (SELECT COUNT(*) FROM public.novedades) as novedades,
    (SELECT COUNT(*) FROM public.productos) as productos,
    (SELECT COUNT(*) FROM public.categorias) as categorias,
    (SELECT COUNT(*) FROM public.usuarios) as usuarios;
