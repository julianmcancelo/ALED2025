import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { supabase, SupabaseProducto, SupabaseCategoria, TABLES } from '../config/supabase.config';

/**
 * SERVICIO DE PRODUCTOS CON SUPABASE PARA ALED2025
 * ================================================
 * 
 * Servicio de gestión de productos migrado de Firebase a Supabase
 * Incluye funcionalidades avanzadas de búsqueda y tiempo real
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

export interface ProductoConCategoria extends SupabaseProducto {
  categoria?: {
    id: string;
    nombre: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductosSupabaseService {
  
  // 📊 ESTADO REACTIVO
  private productosSubject = new BehaviorSubject<ProductoConCategoria[]>([]);
  public productos$ = this.productosSubject.asObservable();
  
  private categoriasSubject = new BehaviorSubject<SupabaseCategoria[]>([]);
  public categorias$ = this.categoriasSubject.asObservable();

  // 🔄 SUSCRIPCIONES TIEMPO REAL
  private productosSubscription: any;
  private categoriasSubscription: any;

  constructor(private supabaseService: SupabaseService) {
    console.log('📦 Inicializando ProductosSupabaseService...');
    this.initializeRealtimeSubscriptions();
    this.loadInitialData();
  }

  // 🚀 INICIALIZACIÓN

  /**
   * Configura suscripciones en tiempo real
   */
  private initializeRealtimeSubscriptions(): void {
    console.log('🔄 Configurando suscripciones en tiempo real...');
    
    // Suscripción a cambios en productos
    this.productosSubscription = supabase
      .channel('productos_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.PRODUCTOS }, 
        () => {
          console.log('🔄 Cambio detectado en productos, recargando...');
          this.loadProductos();
        }
      )
      .subscribe();

    // Suscripción a cambios en categorías
    this.categoriasSubscription = supabase
      .channel('categorias_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.CATEGORIAS }, 
        () => {
          console.log('🔄 Cambio detectado en categorías, recargando...');
          this.loadCategorias();
        }
      )
      .subscribe();
  }

  /**
   * Carga datos iniciales
   */
  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadProductos(),
        this.loadCategorias()
      ]);
      console.log('✅ Datos iniciales cargados');
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error);
    }
  }

  /**
   * Carga productos con información de categoría
   */
  private async loadProductos(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTOS)
        .select(`
          *,
          categoria:categorias(id, nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.productosSubject.next(data || []);
      console.log(`📦 ${data?.length || 0} productos cargados`);
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  }

  /**
   * Carga categorías activas
   */
  private async loadCategorias(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIAS)
        .select('*')
        .eq('activa', true)
        .order('nombre', { ascending: true });

      if (error) throw error;

      this.categoriasSubject.next(data || []);
      console.log(`🗂️ ${data?.length || 0} categorías cargadas`);
    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
    }
  }

  // 📖 MÉTODOS DE LECTURA

  /**
   * Obtiene todos los productos
   */
  obtenerProductos(): Observable<ProductoConCategoria[]> {
    return this.productos$;
  }

  /**
   * Obtiene productos activos
   */
  obtenerProductosActivos(): Observable<ProductoConCategoria[]> {
    return this.productos$.pipe(
      map(productos => productos.filter(p => p.activo))
    );
  }

  /**
   * Obtiene productos destacados
   */
  obtenerProductosDestacados(): Observable<ProductoConCategoria[]> {
    return this.productos$.pipe(
      map(productos => productos.filter(p => p.activo && p.es_destacado))
    );
  }

  /**
   * Obtiene un producto por ID
   */
  obtenerProductoPorId(id: string): Observable<ProductoConCategoria | null> {
    console.log(`🔍 Buscando producto por ID: ${id}`);
    
    return from(supabase
      .from(TABLES.PRODUCTOS)
      .select(`
        *,
        categoria:categorias(id, nombre)
      `)
      .eq('id', id)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error obteniendo producto por ID:', error);
          return null;
        }
        console.log('✅ Producto encontrado:', data?.nombre);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error obteniendo producto:', error);
        return from([null]);
      })
    );
  }

  /**
   * Busca productos por término
   */
  buscarProductos(termino: string): Observable<ProductoConCategoria[]> {
    if (!termino || termino.trim() === '') {
      return this.obtenerProductosActivos();
    }

    console.log(`🔍 Buscando productos con término: "${termino}"`);
    
    return from(supabase
      .from(TABLES.PRODUCTOS)
      .select(`
        *,
        categoria:categorias(id, nombre)
      `)
      .eq('activo', true)
      .or(`nombre.ilike.%${termino}%,descripcion.ilike.%${termino}%`)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log(`✅ ${data?.length || 0} productos encontrados para "${termino}"`);
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error buscando productos:', error);
        return from([[]]);
      })
    );
  }

  /**
   * Obtiene productos por categoría
   */
  obtenerProductosPorCategoria(categoriaId: string): Observable<ProductoConCategoria[]> {
    console.log(`🗂️ Obteniendo productos de categoría: ${categoriaId}`);
    
    return from(supabase
      .from(TABLES.PRODUCTOS)
      .select(`
        *,
        categoria:categorias(id, nombre)
      `)
      .eq('activo', true)
      .eq('categoria_id', categoriaId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log(`✅ ${data?.length || 0} productos encontrados en categoría`);
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error obteniendo productos por categoría:', error);
        return from([[]]);
      })
    );
  }

  // ✏️ MÉTODOS DE ESCRITURA

  /**
   * Crea un nuevo producto
   */
  crearProducto(producto: Omit<SupabaseProducto, 'id' | 'created_at' | 'updated_at'>): Observable<SupabaseProducto> {
    console.log('➕ Creando producto:', producto.nombre);
    
    return from(supabase
      .from(TABLES.PRODUCTOS)
      .insert(producto)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Producto creado exitosamente:', data.nombre);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error creando producto:', error);
        console.error('❌ Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      })
    );
  }

  /**
   * Actualiza un producto existente
   */
  actualizarProducto(id: string, datos: Partial<SupabaseProducto>): Observable<SupabaseProducto> {
    console.log(`✏️ Actualizando producto ID: ${id}`);
    
    return from(supabase
      .from(TABLES.PRODUCTOS)
      .update(datos)
      .eq('id', id)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Producto actualizado exitosamente:', data.nombre);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error actualizando producto:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un producto
   */
  eliminarProducto(id: string): Observable<boolean> {
    console.log(`🗑️ Eliminando producto ID: ${id}`);
    
    return from(supabase
      .from(TABLES.PRODUCTOS)
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        console.log('✅ Producto eliminado exitosamente');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error eliminando producto:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza el stock de un producto
   */
  actualizarStock(id: string, nuevoStock: number): Observable<SupabaseProducto> {
    if (nuevoStock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    console.log(`📊 Actualizando stock del producto ${id} a ${nuevoStock}`);
    
    return this.actualizarProducto(id, { stock: nuevoStock });
  }

  /**
   * Cambia el estado activo de un producto
   */
  cambiarEstadoProducto(id: string, activo: boolean): Observable<SupabaseProducto> {
    console.log(`🔄 Cambiando estado del producto ${id} a ${activo ? 'activo' : 'inactivo'}`);
    
    return this.actualizarProducto(id, { activo });
  }

  // 🗂️ MÉTODOS DE CATEGORÍAS

  /**
   * Obtiene todas las categorías
   */
  obtenerCategorias(): Observable<SupabaseCategoria[]> {
    return this.categorias$;
  }

  /**
   * Crea una nueva categoría
   */
  crearCategoria(nombre: string, descripcion?: string): Observable<SupabaseCategoria> {
    console.log('➕ Creando categoría:', nombre);
    
    return from(supabase
      .from(TABLES.CATEGORIAS)
      .insert({ nombre, descripcion, activa: true })
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Categoría creada exitosamente:', data.nombre);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error creando categoría:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza una categoría
   */
  actualizarCategoria(id: string, nombre: string, descripcion?: string): Observable<SupabaseCategoria> {
    console.log(`✏️ Actualizando categoría ID: ${id}`);
    
    return from(supabase
      .from(TABLES.CATEGORIAS)
      .update({ nombre, descripcion })
      .eq('id', id)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Categoría actualizada exitosamente:', data.nombre);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error actualizando categoría:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina una categoría
   */
  eliminarCategoria(id: string): Observable<boolean> {
    console.log(`🗑️ Eliminando categoría ID: ${id}`);
    
    return from(supabase
      .from(TABLES.CATEGORIAS)
      .delete()
      .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        console.log('✅ Categoría eliminada exitosamente');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error eliminando categoría:', error);
        throw error;
      })
    );
  }

  // 📊 MÉTODOS DE ESTADÍSTICAS

  /**
   * Obtiene estadísticas de productos
   */
  obtenerEstadisticas(): Observable<any> {
    return this.productos$.pipe(
      map(productos => {
        const total = productos.length;
        const activos = productos.filter(p => p.activo).length;
        const destacados = productos.filter(p => p.es_destacado).length;
        const sinStock = productos.filter(p => (p.stock || 0) === 0).length;
        
        return {
          total,
          activos,
          inactivos: total - activos,
          destacados,
          sinStock,
          conStock: total - sinStock
        };
      })
    );
  }

  // 🧹 LIMPIEZA

  /**
   * Limpia las suscripciones al destruir el servicio
   */
  ngOnDestroy(): void {
    if (this.productosSubscription) {
      this.productosSubscription.unsubscribe();
    }
    if (this.categoriasSubscription) {
      this.categoriasSubscription.unsubscribe();
    }
    console.log('🧹 Suscripciones de tiempo real limpiadas');
  }
}
