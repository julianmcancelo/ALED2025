import { supabase, TABLES } from '../config/supabase.config';
import { CategoriaService } from '../servicios/categoria.service';

/**
 * UTILIDADES PARA PROBAR CONEXIÓN CON SUPABASE
 * ============================================
 * 
 * Funciones utilitarias para probar la conexión y lectura
 * de datos desde Supabase de forma directa
 */

export class TestSupabaseConnection {
  
  /**
   * Prueba la conexión básica con Supabase
   */
  static async probarConexionBasica(): Promise<boolean> {
    try {
      console.log('🔍 Probando conexión básica con Supabase...');
      
      // Intentar una consulta simple
      const { data, error } = await supabase
        .from('categorias')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        console.error('❌ Error en conexión básica:', error);
        return false;
      }
      
      console.log('✅ Conexión básica exitosa');
      return true;
      
    } catch (error) {
      console.error('❌ Error inesperado en conexión:', error);
      return false;
    }
  }
  
  /**
   * Prueba la lectura de categorías directamente
   */
  static async probarLecturaCategorias(): Promise<void> {
    try {
      console.log('📂 Probando lectura de categorías...');
      
      const { data: categorias, error } = await supabase
        .from(TABLES.CATEGORIAS)
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      if (error) {
        console.error('❌ Error leyendo categorías:', error);
        console.error('📋 Detalles:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }
      
      console.log('✅ Lectura exitosa!');
      console.log(`📊 Categorías encontradas: ${categorias?.length || 0}`);
      
      if (categorias && categorias.length > 0) {
        console.log('📋 Lista de categorías:');
        categorias.forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.nombre} (ID: ${cat.id})`);
        });
        
        console.log('📄 Primera categoría completa:');
        console.table(categorias[0]);
      } else {
        console.log('⚠️ No hay categorías en la base de datos');
      }
      
    } catch (error) {
      console.error('❌ Error inesperado:', error);
    }
  }
  
  /**
   * Prueba usando el servicio de categorías
   */
  static probarConServicio(): void {
    console.log('🔧 Probando con CategoriaService...');
    
    const categoriaService = new CategoriaService();
    
    categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Servicio funcionando correctamente!');
        console.log(`📊 Categorías obtenidas: ${categorias.length}`);
        
        if (categorias.length > 0) {
          console.log('📋 Categorías:');
          categorias.forEach((cat, index) => {
            console.log(`  ${index + 1}. ${cat.nombre}`);
          });
        }
      },
      error: (error) => {
        console.error('❌ Error en el servicio:', error);
      }
    });
  }
  
  /**
   * Crea una categoría de prueba
   */
  static async crearCategoriaEjemplo(): Promise<void> {
    try {
      console.log('➕ Creando categoría de ejemplo...');
      
      const nombreCategoria = `Categoría Ejemplo ${Date.now()}`;
      
      const { data, error } = await supabase
        .from(TABLES.CATEGORIAS)
        .insert([
          {
            nombre: nombreCategoria,
            descripcion: 'Categoría creada para pruebas',
            activo: true
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creando categoría:', error);
        return;
      }
      
      console.log('✅ Categoría creada exitosamente:');
      console.table(data);
      
      // Probar lectura nuevamente
      await this.probarLecturaCategorias();
      
    } catch (error) {
      console.error('❌ Error inesperado creando categoría:', error);
    }
  }
  
  /**
   * Verifica la estructura de la tabla categorias
   */
  static async verificarEstructuraTabla(): Promise<void> {
    try {
      console.log('🔍 Verificando estructura de tabla categorias...');
      
      const { data, error } = await supabase
        .from(TABLES.CATEGORIAS)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Error verificando tabla:', error);
        
        if (error.code === 'PGRST116') {
          console.log('📋 Posibles problemas:');
          console.log('   1. La tabla "categorias" no existe');
          console.log('   2. No tienes permisos para acceder');
          console.log('   3. RLS está bloqueando el acceso');
          console.log('');
          console.log('💡 Soluciones:');
          console.log('   1. Ejecutar script de creación de tablas');
          console.log('   2. Verificar políticas RLS en Supabase');
          console.log('   3. Comprobar configuración de permisos');
        }
        
        return;
      }
      
      console.log('✅ Tabla accesible');
      
      if (data && data.length > 0) {
        console.log('📊 Campos de la tabla:');
        Object.keys(data[0]).forEach(campo => {
          const valor = data[0][campo];
          console.log(`  - ${campo}: ${typeof valor} (ej: ${valor})`);
        });
      } else {
        console.log('📭 Tabla vacía pero accesible');
      }
      
    } catch (error) {
      console.error('❌ Error verificando estructura:', error);
    }
  }
  
  /**
   * Ejecuta todas las pruebas en secuencia
   */
  static async ejecutarTodasLasPruebas(): Promise<void> {
    console.log('🚀 EJECUTANDO PRUEBAS COMPLETAS DE SUPABASE');
    console.log('==========================================');
    
    // 1. Conexión básica
    const conexionOk = await this.probarConexionBasica();
    if (!conexionOk) {
      console.log('❌ Conexión básica falló. Deteniendo pruebas.');
      return;
    }
    
    console.log('');
    
    // 2. Verificar estructura
    await this.verificarEstructuraTabla();
    
    console.log('');
    
    // 3. Probar lectura
    await this.probarLecturaCategorias();
    
    console.log('');
    
    // 4. Probar servicio
    this.probarConServicio();
    
    console.log('');
    console.log('🎯 PRUEBAS COMPLETADAS');
    console.log('======================');
    console.log('💡 Para crear una categoría de ejemplo:');
    console.log('   TestSupabaseConnection.crearCategoriaEjemplo()');
  }
}

// Función global para usar en la consola del navegador
(window as any).testSupabase = TestSupabaseConnection;
