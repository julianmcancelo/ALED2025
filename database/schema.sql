-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA ALED2025 - SUPABASE
-- =====================================================
-- 
-- Esquema SQL completo para migración de Firebase a Supabase
-- Incluye tablas, índices, políticas RLS y triggers
-- 
-- DESARROLLADO POR: Cancelo Julian & Nicolas Otero
-- INSTITUTO: Instituto Beltrán
-- MATERIA: ALED III - T.A.S.
-- =====================================================

-- 🔧 EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 🗂️ TABLA: CATEGORÍAS
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📦 TABLA: PRODUCTOS
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    es_destacado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 👥 TABLA: USUARIOS (EXTENDIDA DE AUTH.USERS)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('admin', 'cliente')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🛒 TABLA: PEDIDOS
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado')),
    direccion_envio TEXT,
    telefono VARCHAR(20),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🛍️ TABLA: ITEMS DE PEDIDO
CREATE TABLE items_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_destacado ON productos(es_destacado);
CREATE INDEX idx_productos_precio ON productos(precio);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_items_pedido ON items_pedido(pedido_id);

-- 🔄 FUNCIÓN PARA ACTUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ⚡ TRIGGERS PARA AUTO-UPDATE DE TIMESTAMPS
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 🔐 POLÍTICAS RLS (ROW LEVEL SECURITY)

-- Habilitar RLS en todas las tablas
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;

-- 📖 POLÍTICAS DE LECTURA (SELECT)

-- Categorías: Todos pueden ver categorías activas
CREATE POLICY "Categorías visibles para todos" ON categorias
    FOR SELECT USING (activa = true);

-- Productos: Todos pueden ver productos activos
CREATE POLICY "Productos visibles para todos" ON productos
    FOR SELECT USING (activo = true);

-- Usuarios: Solo pueden ver su propio perfil
CREATE POLICY "Usuarios ven su propio perfil" ON usuarios
    FOR SELECT USING (auth.uid() = id);

-- Pedidos: Solo pueden ver sus propios pedidos
CREATE POLICY "Usuarios ven sus propios pedidos" ON pedidos
    FOR SELECT USING (auth.uid() = usuario_id);

-- Items: Solo pueden ver items de sus pedidos
CREATE POLICY "Usuarios ven items de sus pedidos" ON items_pedido
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pedidos 
            WHERE pedidos.id = items_pedido.pedido_id 
            AND pedidos.usuario_id = auth.uid()
        )
    );

-- ✏️ POLÍTICAS DE ESCRITURA (INSERT/UPDATE/DELETE)

-- Solo admins pueden gestionar categorías
CREATE POLICY "Solo admins gestionan categorías" ON categorias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol = 'admin'
        )
    );

-- Solo admins pueden gestionar productos
CREATE POLICY "Solo admins gestionan productos" ON productos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol = 'admin'
        )
    );

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios actualizan su perfil" ON usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Usuarios pueden crear sus pedidos
CREATE POLICY "Usuarios crean sus pedidos" ON pedidos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Usuarios pueden ver/actualizar sus pedidos pendientes
CREATE POLICY "Usuarios gestionan sus pedidos" ON pedidos
    FOR UPDATE USING (auth.uid() = usuario_id AND estado = 'pendiente');

-- 📊 DATOS DE EJEMPLO PARA DESARROLLO

-- Insertar categorías de ejemplo
INSERT INTO categorias (nombre, descripcion) VALUES
('Electrónicos', 'Dispositivos electrónicos y tecnología'),
('Hogar', 'Artículos para el hogar y decoración'),
('Ropa', 'Vestimenta y accesorios'),
('Deportes', 'Artículos deportivos y fitness'),
('Libros', 'Libros y material educativo');

-- 🎯 CONFIGURACIÓN DE STORAGE

-- Crear buckets para almacenamiento
INSERT INTO storage.buckets (id, name, public) VALUES
('productos-imagenes', 'productos-imagenes', true),
('avatares-usuarios', 'avatares-usuarios', true);

-- Políticas para storage de productos (público)
CREATE POLICY "Imágenes de productos públicas" ON storage.objects
    FOR SELECT USING (bucket_id = 'productos-imagenes');

CREATE POLICY "Solo admins suben imágenes de productos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'productos-imagenes' AND
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol = 'admin'
        )
    );

-- Políticas para avatares (privado)
CREATE POLICY "Usuarios ven su avatar" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'avatares-usuarios' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Usuarios suben su avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatares-usuarios' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- 📝 COMENTARIOS FINALES
COMMENT ON TABLE categorias IS 'Categorías de productos del e-commerce';
COMMENT ON TABLE productos IS 'Productos disponibles en la tienda';
COMMENT ON TABLE usuarios IS 'Perfiles de usuarios extendidos de auth.users';
COMMENT ON TABLE pedidos IS 'Pedidos realizados por los usuarios';
COMMENT ON TABLE items_pedido IS 'Items individuales de cada pedido';

-- ✅ ESQUEMA COMPLETADO
SELECT 'Esquema de base de datos ALED2025 creado exitosamente' AS mensaje;
