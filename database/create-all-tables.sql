-- =====================================================
-- SCRIPT COMPLETO: Crear todas las tablas para ALED2025
-- DESCRIPCIÓN: Script para crear estructura completa de base de datos
-- FECHA: 2025-10-12 (Actualizado - Migración completa a Supabase)
-- =====================================================

-- 1. CREAR TABLA USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20),
    password_hash TEXT,
    rol VARCHAR(20) CHECK (rol IN ('admin', 'usuario')) NOT NULL DEFAULT 'usuario',
    activo BOOLEAN NOT NULL DEFAULT true,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR TABLA CATEGORIAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categorias (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR TABLA PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id BIGINT REFERENCES public.categorias(id),
    stock INTEGER DEFAULT 0,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    es_destacado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREAR TABLA PEDIDOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paymentId VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'pendiente',
    total DECIMAL(10,2) NOT NULL,
    fechaCreacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fechaActualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numeroSeguimiento VARCHAR(255),
    notasAdmin TEXT,
    clienteId UUID REFERENCES public.usuarios(id), -- ← Campo que faltaba
    clienteNombre VARCHAR(255),
    clienteEmail VARCHAR(255),
    clienteTelefono VARCHAR(50),
    direccionEntrega TEXT,
    ciudadEntrega VARCHAR(100),
    codigoPostalEntrega VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREAR TABLA ITEMS_PEDIDO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.items_pedido (
    id BIGSERIAL PRIMARY KEY,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
    producto_id BIGINT REFERENCES public.productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREAR TABLA CONFIGURACION
-- =====================================================
CREATE TABLE IF NOT EXISTS public.configuracion (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255),
    subtitulo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREAR TABLA NOVEDADES
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

-- 8. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON public.productos(activo);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON public.pedidos(clienteId);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_items_pedido ON public.items_pedido(pedido_id);

-- 9. CREAR TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers a todas las tablas
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON public.usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categorias_updated_at ON public.categorias;
CREATE TRIGGER update_categorias_updated_at 
    BEFORE UPDATE ON public.categorias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_productos_updated_at ON public.productos;
CREATE TRIGGER update_productos_updated_at 
    BEFORE UPDATE ON public.productos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER update_pedidos_updated_at 
    BEFORE UPDATE ON public.pedidos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_configuracion_updated_at ON public.configuracion;
CREATE TRIGGER update_configuracion_updated_at 
    BEFORE UPDATE ON public.configuracion 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_novedades_updated_at ON public.novedades;
CREATE TRIGGER update_novedades_updated_at 
    BEFORE UPDATE ON public.novedades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. INSERTAR DATOS DE EJEMPLO
-- =====================================================

-- Configuración por defecto
INSERT INTO public.configuracion (clave, titulo, subtitulo) 
VALUES (
    'sitio',
    'ALED2025 - E-commerce',
    'Proyecto desarrollado con Angular y Supabase por Cancelo Julian & Nicolas Otero'
) ON CONFLICT (clave) DO NOTHING;

-- Categorías de ejemplo
INSERT INTO public.categorias (nombre, descripcion, activo) 
VALUES 
    ('Electrónicos', 'Productos tecnológicos y electrónicos', true),
    ('Hogar', 'Artículos para el hogar y cocina', true),
    ('Ropa', 'Vestimenta y accesorios', true),
    ('Deportes', 'Artículos deportivos y fitness', true),
    ('Libros', 'Libros y material educativo', true)
ON CONFLICT DO NOTHING;

-- Productos de ejemplo (solo si hay categorías)
DO $$
DECLARE
    categoria_electronica_id BIGINT;
    categoria_hogar_id BIGINT;
    categoria_ropa_id BIGINT;
BEGIN
    -- Obtener IDs de categorías
    SELECT id INTO categoria_electronica_id FROM public.categorias WHERE nombre = 'Electrónicos' LIMIT 1;
    SELECT id INTO categoria_hogar_id FROM public.categorias WHERE nombre = 'Hogar' LIMIT 1;
    SELECT id INTO categoria_ropa_id FROM public.categorias WHERE nombre = 'Ropa' LIMIT 1;

    -- Insertar productos si hay categorías
    IF categoria_electronica_id IS NOT NULL THEN
        INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
        VALUES 
            ('Smartphone Galaxy A54', 'Smartphone Samsung Galaxy A54 5G con pantalla de 6.4 pulgadas', 299999, categoria_electronica_id, 15, true, true),
            ('Notebook Lenovo IdeaPad 3', 'Notebook Lenovo IdeaPad 3 15.6" Intel Core i5 8GB RAM 256GB SSD', 549999, categoria_electronica_id, 8, true, true),
            ('Auriculares Sony WH-1000XM4', 'Auriculares inalámbricos Sony con cancelación de ruido', 89999, categoria_electronica_id, 25, true, false)
        ON CONFLICT DO NOTHING;
    END IF;

    IF categoria_hogar_id IS NOT NULL THEN
        INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
        VALUES 
            ('Cafetera Espresso Philips', 'Cafetera espresso automática Philips con molinillo integrado', 45999, categoria_hogar_id, 12, true, false),
            ('Set de Sartenes Antiadherentes', 'Set de 3 sartenes antiadherentes de diferentes tamaños', 8999, categoria_hogar_id, 18, true, false)
        ON CONFLICT DO NOTHING;
    END IF;

    IF categoria_ropa_id IS NOT NULL THEN
        INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
        VALUES 
            ('Remera Básica Algodón', 'Remera básica de algodón 100% disponible en varios colores', 2999, categoria_ropa_id, 50, true, false),
            ('Jean Clásico Azul', 'Jean clásico de corte recto en color azul', 7999, categoria_ropa_id, 30, true, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Novedades de ejemplo
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

-- 11. HABILITAR RLS BÁSICO
-- =====================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
DROP POLICY IF EXISTS "Permitir todo en usuarios" ON public.usuarios;
CREATE POLICY "Permitir todo en usuarios" ON public.usuarios FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en categorias" ON public.categorias;
CREATE POLICY "Permitir todo en categorias" ON public.categorias FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en productos" ON public.productos;
CREATE POLICY "Permitir todo en productos" ON public.productos FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en pedidos" ON public.pedidos;
CREATE POLICY "Permitir todo en pedidos" ON public.pedidos FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en items_pedido" ON public.items_pedido;
CREATE POLICY "Permitir todo en items_pedido" ON public.items_pedido FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en configuracion" ON public.configuracion;
CREATE POLICY "Permitir todo en configuracion" ON public.configuracion FOR ALL USING (true);

DROP POLICY IF EXISTS "Permitir todo en novedades" ON public.novedades;
CREATE POLICY "Permitir todo en novedades" ON public.novedades FOR ALL USING (true);

-- 12. VERIFICAR RESULTADOS
-- =====================================================
SELECT 
    'TODAS LAS TABLAS CREADAS EXITOSAMENTE' as resultado,
    (SELECT COUNT(*) FROM public.usuarios) as usuarios,
    (SELECT COUNT(*) FROM public.categorias) as categorias,
    (SELECT COUNT(*) FROM public.productos) as productos,
    (SELECT COUNT(*) FROM public.pedidos) as pedidos,
    (SELECT COUNT(*) FROM public.configuracion) as configuraciones,
    (SELECT COUNT(*) FROM public.novedades) as novedades;

-- 13. MOSTRAR ESTRUCTURA DE TABLA PEDIDOS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- INSTRUCCIONES:
-- =====================================================
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Verificar que todas las tablas se crearon correctamente
-- 3. Confirmar que la columna 'clienteId' existe en la tabla pedidos
-- 4. Probar la aplicación nuevamente
-- =====================================================
