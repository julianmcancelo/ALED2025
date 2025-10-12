-- =====================================================
-- SCRIPT: Insertar productos de ejemplo en Supabase
-- DESCRIPCIÓN: Productos de muestra para testing
-- FECHA: 2025-01-10
-- =====================================================

-- Insertar productos de ejemplo (solo si no existen)
INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Smartphone Galaxy A54',
    'Smartphone Samsung Galaxy A54 5G con pantalla de 6.4 pulgadas, cámara triple de 50MP y batería de 5000mAh',
    299999,
    (SELECT id FROM public.categorias WHERE nombre = 'Electrónicos' LIMIT 1),
    15,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Smartphone Galaxy A54');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Notebook Lenovo IdeaPad 3',
    'Notebook Lenovo IdeaPad 3 15.6" Intel Core i5 8GB RAM 256GB SSD',
    549999,
    (SELECT id FROM public.categorias WHERE nombre = 'Electrónicos' LIMIT 1),
    8,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Notebook Lenovo IdeaPad 3');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Auriculares Sony WH-1000XM4',
    'Auriculares inalámbricos Sony WH-1000XM4 con cancelación de ruido y 30 horas de batería',
    89999,
    (SELECT id FROM public.categorias WHERE nombre = 'Electrónicos' LIMIT 1),
    25,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Auriculares Sony WH-1000XM4');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Remera Básica Algodón',
    'Remera básica de algodón 100% disponible en varios colores y talles',
    2999,
    (SELECT id FROM public.categorias WHERE nombre = 'Ropa' LIMIT 1),
    50,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Remera Básica Algodón');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Jean Clásico Azul',
    'Jean clásico de corte recto en color azul, disponible en todos los talles',
    7999,
    (SELECT id FROM public.categorias WHERE nombre = 'Ropa' LIMIT 1),
    30,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Jean Clásico Azul');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Zapatillas Running Nike',
    'Zapatillas Nike para running con tecnología Air Max y suela de goma antideslizante',
    15999,
    (SELECT id FROM public.categorias WHERE nombre = 'Calzado' LIMIT 1),
    20,
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Zapatillas Running Nike');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Cafetera Espresso Philips',
    'Cafetera espresso automática Philips con molinillo integrado y espumador de leche',
    45999,
    (SELECT id FROM public.categorias WHERE nombre = 'Hogar' LIMIT 1),
    12,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Cafetera Espresso Philips');

INSERT INTO public.productos (nombre, descripcion, precio, categoria_id, stock, activo, es_destacado) 
SELECT 
    'Set de Sartenes Antiadherentes',
    'Set de 3 sartenes antiadherentes de diferentes tamaños con mango ergonómico',
    8999,
    (SELECT id FROM public.categorias WHERE nombre = 'Hogar' LIMIT 1),
    18,
    true,
    false
WHERE NOT EXISTS (SELECT 1 FROM public.productos WHERE nombre = 'Set de Sartenes Antiadherentes');

-- Mostrar resultado
SELECT 
    'Productos de ejemplo insertados exitosamente' as resultado,
    COUNT(*) as total_productos
FROM public.productos;
