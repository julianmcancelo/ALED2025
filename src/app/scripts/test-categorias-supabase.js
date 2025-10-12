/**
 * SCRIPT DE PRUEBA PARA LEER CATEGORÍAS DESDE SUPABASE
 * ===================================================
 * 
 * Script que puedes ejecutar en la consola del navegador
 * para probar la conexión y lectura de categorías desde Supabase
 * 
 * INSTRUCCIONES:
 * 1. Abre la aplicación en el navegador
 * 2. Abre las herramientas de desarrollador (F12)
 * 3. Ve a la pestaña "Console"
 * 4. Copia y pega este código
 * 5. Presiona Enter para ejecutar
 */

console.log('🧪 INICIANDO PRUEBA DE CATEGORÍAS SUPABASE');
console.log('==========================================');

// Función para probar la lectura de categorías
async function probarCategoriasSupabase() {
  try {
    console.log('📡 Conectando a Supabase...');
    
    // Importar la configuración de Supabase (si está disponible globalmente)
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase no está disponible globalmente');
      console.log('💡 Asegúrate de que la aplicación esté ejecutándose');
      return;
    }
    
    console.log('✅ Cliente Supabase encontrado');
    
    // Probar conexión básica
    console.log('🔍 Probando conexión a la tabla categorias...');
    
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Error al consultar categorías:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return;
    }
    
    console.log('✅ ¡Consulta exitosa!');
    console.log('📊 Categorías encontradas:', categorias?.length || 0);
    
    if (categorias && categorias.length > 0) {
      console.log('📂 Lista de categorías:');
      categorias.forEach((categoria, index) => {
        console.log(`  ${index + 1}. ${categoria.nombre} (ID: ${categoria.id})`);
      });
      
      console.log('📋 Detalles de la primera categoría:');
      console.table(categorias[0]);
    } else {
      console.log('⚠️ No se encontraron categorías en la base de datos');
      console.log('💡 Puedes crear una categoría de prueba ejecutando: crearCategoriaEjemplo()');
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Función para crear una categoría de ejemplo
async function crearCategoriaEjemplo() {
  try {
    console.log('➕ Creando categoría de ejemplo...');
    
    const nombreCategoria = `Categoría Prueba ${Date.now()}`;
    
    const { data, error } = await supabase
      .from('categorias')
      .insert([
        {
          nombre: nombreCategoria,
          descripcion: 'Categoría creada desde script de prueba',
          activo: true
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear categoría:', error);
      return;
    }
    
    console.log('✅ Categoría creada exitosamente:');
    console.table(data);
    
    // Volver a probar la lectura
    console.log('🔄 Probando lectura nuevamente...');
    await probarCategoriasSupabase();
    
  } catch (error) {
    console.error('❌ Error creando categoría:', error);
  }
}

// Función para verificar la estructura de la tabla
async function verificarEstructuraTabla() {
  try {
    console.log('🔍 Verificando estructura de la tabla categorias...');
    
    // Intentar obtener información de la tabla
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error verificando tabla:', error);
      
      if (error.code === 'PGRST116') {
        console.log('📋 La tabla "categorias" no existe o no tienes permisos');
        console.log('💡 Posibles soluciones:');
        console.log('   1. Ejecutar el script SQL de creación de tablas');
        console.log('   2. Verificar permisos RLS en Supabase');
        console.log('   3. Comprobar que el nombre de la tabla sea correcto');
      }
      
      return;
    }
    
    console.log('✅ Tabla categorias accesible');
    
    if (data && data.length > 0) {
      console.log('📊 Estructura de la tabla (basada en primer registro):');
      const campos = Object.keys(data[0]);
      campos.forEach(campo => {
        const valor = data[0][campo];
        const tipo = typeof valor;
        console.log(`  - ${campo}: ${tipo} (ejemplo: ${valor})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
  }
}

// Función principal que ejecuta todas las pruebas
async function ejecutarPruebas() {
  console.log('🚀 EJECUTANDO PRUEBAS COMPLETAS');
  console.log('===============================');
  
  await verificarEstructuraTabla();
  console.log('');
  await probarCategoriasSupabase();
  
  console.log('');
  console.log('🎯 PRUEBAS COMPLETADAS');
  console.log('======================');
  console.log('💡 Funciones disponibles:');
  console.log('   - probarCategoriasSupabase()');
  console.log('   - crearCategoriaEjemplo()');
  console.log('   - verificarEstructuraTabla()');
  console.log('   - ejecutarPruebas()');
}

// Ejecutar pruebas automáticamente
ejecutarPruebas();
