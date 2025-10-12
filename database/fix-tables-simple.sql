-- =====================================================
-- SCRIPT SIMPLIFICADO: Crear tablas faltantes sin RLS
-- DESCRIPCIÓN: Script sin políticas complejas para evitar errores
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

-- Insertar novedades de ejemplo
INSERT INTO public.novedades (titulo, descripcion, imagen_url, enlace_url, activo, fecha_inicio, fecha_fin) 
VALUES 
    (
        '¡Gran Oferta de Lanzamiento!',
        'Descuentos especiales en toda la tienda para celebrar nuestro lanzamiento.',
        'https://via.placeholder.com/800x400/667eea/ffffff?text=Oferta+Lanzamiento',
        '/productos',
        true,
        NOW(),
        NOW() + INTERVAL '30 days'
    ),
    (
        'Nuevos Productos Disponibles',
        'Descubre nuestra nueva colección de productos tecnológicos.',
        'https://via.placeholder.com/800x400/764ba2/ffffff?text=Nuevos+Productos',
        '/productos',
        true,
        NOW(),
        NOW() + INTERVAL '15 days'
    ),
    (
        'Envío Gratis en Compras +$50.000',
        'Aprovecha nuestro envío gratuito en compras superiores a $50.000.',
        'https://via.placeholder.com/800x400/2c3e50/ffffff?text=Envio+Gratis',
        '/productos',
        true,
        NOW(),
        NOW() + INTERVAL '45 days'
    )
ON CONFLICT DO NOTHING;

-- 3. INSERTAR PRODUCTOS DE EJEMPLO
-- =====================================================
-- Solo si hay categorías disponibles
DO $$
DECLARE
    categoria_electronica_id BIGINT;
    categoria_ropa_id BIGINT;
    categoria_hogar_id BIGINT;
BEGIN
    -- Buscar IDs de categorías existentes
    SELECT id INTO categoria_electronica_id FROM public.categorias WHERE nombre ILIKE '%electr%' OR nombre ILIKE '%tecno%' LIMIT 1;
    SELECT id INTO categoria_ropa_id FROM public.categorias WHERE nombre ILIKE '%ropa%' OR nombre ILIKE '%vest%' LIMIT 1;
    SELECT id INTO categoria_hogar_id FROM public.categorias WHERE nombre ILIKE '%hogar%' OR nombre ILIKE '%cocina%' LIMIT 1;

    -- Si no hay categorías, usar la primera disponible
    IF categoria_electronica_id IS NULL THEN
        SELECT id INTO categoria_electronica_id FROM public.categorias LIMIT 1;
    END IF;
    
    IF categoria_ropa_id IS NULL THEN
        SELECT id INTO categoria_ropa_id FROM public.categorias LIMIT 1;
    END IF;
    
    IF categoria_hogar_id IS NULL THEN
        SELECT id INTO categoria_hogar_id FROM public.categorias LIMIT 1;
    END IF;

    -- Insertar productos solo si hay categorías
    IF categoria_electronica_id IS NOT NULL THEN
        INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
        VALUES 
            ('Smartphone Galaxy A54', 'Smartphone Samsung Galaxy A54 5G con pantalla de 6.4 pulgadas', 299999, categoria_electronica_id, 15, true, true),
            ('Notebook Lenovo IdeaPad 3', 'Notebook Lenovo IdeaPad 3 15.6" Intel Core i5 8GB RAM 256GB SSD', 549999, categoria_electronica_id, 8, true, true),
            ('Auriculares Sony WH-1000XM4', 'Auriculares inalámbricos Sony con cancelación de ruido', 89999, categoria_electronica_id, 25, true, false)
        ON CONFLICT (nombre) DO NOTHING;
    END IF;

    IF categoria_ropa_id IS NOT NULL THEN
        INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
        VALUES 
            ('Remera Básica Algodón', 'Remera básica de algodón 100% disponible en varios colores', 2999, categoria_ropa_id, 50, true, false),
            ('Jean Clásico Azul', 'Jean clásico de corte recto en color azul', 7999, categoria_ropa_id, 30, true, true),
            ('Zapatillas Running Nike', 'Zapatillas Nike para running con tecnología Air Max', 15999, categoria_ropa_id, 20, true, true)
        ON CONFLICT (nombre) DO NOTHING;
    END IF;

    IF categoria_hogar_id IS NOT NULL THEN
        INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
        VALUES 
            ('Cafetera Espresso Philips', 'Cafetera espresso automática Philips con molinillo integrado', 45999, categoria_hogar_id, 12, true, false),
            ('Set de Sartenes Antiadherentes', 'Set de 3 sartenes antiadherentes de diferentes tamaños', 8999, categoria_hogar_id, 18, true, false)
        ON CONFLICT (nombre) DO NOTHING;
    END IF;
END $$;

-- 4. HABILITAR RLS BÁSICO (sin políticas complejas)
-- =====================================================
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Políticas simples que permiten todo (para evitar errores)
CREATE POLICY "Permitir todo en configuracion" ON public.configuracion FOR ALL USING (true);
CREATE POLICY "Permitir todo en novedades" ON public.novedades FOR ALL USING (true);

-- 5. MOSTRAR RESULTADOS
-- =====================================================
SELECT 
    'TABLAS CREADAS EXITOSAMENTE' as resultado,
    (SELECT COUNT(*) FROM public.configuracion) as configuraciones,
    (SELECT COUNT(*) FROM public.novedades) as novedades,
    (SELECT COUNT(*) FROM public.productos) as productos,
    (SELECT COUNT(*) FROM public.categorias) as categorias;
