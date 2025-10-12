import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { supabase, SupabaseProducto, SupabaseCategoria, TABLES } from '../config/supabase.config';

/**
 * SERVICIO BASE DE SUPABASE PARA ALED2025
 * =======================================
 * 
 * Servicio principal que maneja todas las operaciones con Supabase
 * Incluye autenticación, CRUD de datos y almacenamiento
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  
  // 👤 ESTADO DE AUTENTICACIÓN
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    console.log('🚀 Inicializando SupabaseService para ALED2025...');
    this.initializeAuth();
  }

  // 🔐 MÉTODOS DE AUTENTICACIÓN

  /**
   * Inicializa el estado de autenticación
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.currentUserSubject.next(session?.user || null);

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔄 Cambio de autenticación:', event);
        this.currentUserSubject.next(session?.user || null);
      });
    } catch (error) {
      console.error('❌ Error inicializando autenticación:', error);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  signIn(email: string, password: string): Observable<any> {
    console.log('🔑 Iniciando sesión para:', email);
    return from(supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Sesión iniciada exitosamente');
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error al iniciar sesión:', error);
        throw error;
      })
    );
  }

  /**
   * Registra un nuevo usuario
   */
  signUp(email: string, password: string, userData?: any): Observable<any> {
    console.log('📝 Registrando usuario:', email);
    return from(supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: userData
      }
    })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Usuario registrado exitosamente');
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error al registrar usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Cierra la sesión actual
   */
  signOut(): Observable<any> {
    console.log('🚪 Cerrando sesión...');
    return from(supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) throw error;
        console.log('✅ Sesión cerrada exitosamente');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error al cerrar sesión:', error);
        throw error;
      })
    );
  }

  // 📊 MÉTODOS GENÉRICOS CRUD

  /**
   * Obtiene registros de una tabla
   */
  select<T>(table: string, query?: any): Observable<T[]> {
    console.log(`📖 Obteniendo datos de tabla: ${table}`);
    
    let queryBuilder = supabase.from(table).select('*');
    
    if (query) {
      Object.keys(query).forEach(key => {
        queryBuilder = queryBuilder.eq(key, query[key]);
      });
    }

    return from(queryBuilder).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log(`✅ ${data?.length || 0} registros obtenidos de ${table}`);
        return data as T[];
      }),
      catchError((error) => {
        console.error(`❌ Error obteniendo datos de ${table}:`, error);
        throw error;
      })
    );
  }

  /**
   * Inserta un nuevo registro
   */
  insert<T>(table: string, data: Partial<T>): Observable<T> {
    console.log(`➕ Insertando en tabla: ${table}`, data);
    
    return from(supabase.from(table).insert(data).select().single()).pipe(
      map(({ data: insertedData, error }) => {
        if (error) throw error;
        console.log(`✅ Registro insertado en ${table}:`, insertedData);
        return insertedData as T;
      }),
      catchError((error) => {
        console.error(`❌ Error insertando en ${table}:`, error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un registro existente
   */
  update<T>(table: string, id: string, data: Partial<T>): Observable<T> {
    console.log(`✏️ Actualizando en tabla: ${table}, ID: ${id}`, data);
    
    return from(supabase.from(table).update(data).eq('id', id).select().single()).pipe(
      map(({ data: updatedData, error }) => {
        if (error) throw error;
        console.log(`✅ Registro actualizado en ${table}:`, updatedData);
        return updatedData as T;
      }),
      catchError((error) => {
        console.error(`❌ Error actualizando en ${table}:`, error);
        throw error;
      })
    );
  }

  /**
   * Elimina un registro
   */
  delete(table: string, id: string): Observable<boolean> {
    console.log(`🗑️ Eliminando de tabla: ${table}, ID: ${id}`);
    
    return from(supabase.from(table).delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        console.log(`✅ Registro eliminado de ${table}`);
        return true;
      }),
      catchError((error) => {
        console.error(`❌ Error eliminando de ${table}:`, error);
        throw error;
      })
    );
  }

  // 📦 MÉTODOS ESPECÍFICOS PARA PRODUCTOS

  /**
   * Obtiene productos activos con información de categoría
   */
  getProductosActivos(): Observable<any[]> {
    console.log('📦 Obteniendo productos activos...');
    
    return from(
      supabase
        .from(TABLES.PRODUCTOS)
        .select(`
          *,
          categoria:categorias(id, nombre)
        `)
        .eq('activo', true)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log(`✅ ${data?.length || 0} productos activos obtenidos`);
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error obteniendo productos activos:', error);
        throw error;
      })
    );
  }

  /**
   * Busca productos por término
   */
  buscarProductos(termino: string): Observable<any[]> {
    console.log(`🔍 Buscando productos con término: "${termino}"`);
    
    return from(
      supabase
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
        throw error;
      })
    );
  }

  // 🗂️ MÉTODOS ESPECÍFICOS PARA CATEGORÍAS

  /**
   * Obtiene categorías activas
   */
  getCategoriasActivas(): Observable<SupabaseCategoria[]> {
    console.log('🗂️ Obteniendo categorías activas...');
    
    return from(
      supabase
        .from(TABLES.CATEGORIAS)
        .select('*')
        .eq('activa', true)
        .order('nombre', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        console.log(`✅ ${data?.length || 0} categorías activas obtenidas`);
        return data as SupabaseCategoria[];
      }),
      catchError((error) => {
        console.error('❌ Error obteniendo categorías:', error);
        throw error;
      })
    );
  }

  // 📁 MÉTODOS DE ALMACENAMIENTO (STORAGE)

  /**
   * Sube un archivo al storage
   */
  uploadFile(bucket: string, path: string, file: File): Observable<string> {
    console.log(`📁 Subiendo archivo a ${bucket}/${path}`);
    
    return from(supabase.storage.from(bucket).upload(path, file)).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        
        console.log(`✅ Archivo subido exitosamente: ${publicUrl}`);
        return publicUrl;
      }),
      catchError((error) => {
        console.error('❌ Error subiendo archivo:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un archivo del storage
   */
  deleteFile(bucket: string, path: string): Observable<boolean> {
    console.log(`🗑️ Eliminando archivo de ${bucket}/${path}`);
    
    return from(supabase.storage.from(bucket).remove([path])).pipe(
      map(({ error }) => {
        if (error) throw error;
        console.log(`✅ Archivo eliminado exitosamente`);
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error eliminando archivo:', error);
        throw error;
      })
    );
  }

  // 🔄 MÉTODOS DE TIEMPO REAL

  /**
   * Suscribe a cambios en tiempo real de una tabla
   */
  subscribeToTable(table: string, callback: (payload: any) => void): any {
    console.log(`🔄 Suscribiendo a cambios en tiempo real de: ${table}`);
    
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe();
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario actual es admin
   */
  isAdmin(): Observable<boolean> {
    const user = this.getCurrentUser();
    if (!user) return from([false]);

    return from(
      supabase
        .from(TABLES.USUARIOS)
        .select('rol')
        .eq('id', user.id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return false;
        return data?.rol === 'admin';
      }),
      catchError(() => from([false]))
    );
  }
}
