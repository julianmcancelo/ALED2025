import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { supabase, TABLES } from '../config/supabase.config';

/**
 * @interface Novedad
 * Define la estructura de un banner de novedad/oferta.
 */
export interface Novedad {
  id?: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  enlaceUrl?: string; // Enlace opcional (ej: a un producto o categoría)
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {

  constructor() {
    console.log('📰 Inicializando NovedadesService con Supabase...');
  }

  /**
   * Obtiene todas las novedades ordenadas por fecha de creación.
   */
  getNovedades(): Observable<Novedad[]> {
    return from(supabase
      .from(TABLES.NOVEDADES)
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener novedades:', error);
          throw error;
        }
        console.log('✅ Novedades obtenidas:', data?.length || 0);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en getNovedades:', error);
        throw error;
      })
    );
  }

  /**
   * Crea una nueva novedad.
   */
  async crearNovedad(novedad: Omit<Novedad, 'id' | 'created_at'>): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOVEDADES)
        .insert([
          {
            ...novedad,
            activo: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error al crear novedad:', error);
        throw error;
      }

      console.log('✅ Novedad creada:', novedad.titulo);
      return data;
    } catch (error) {
      console.error('❌ Error en crearNovedad:', error);
      throw error;
    }
  }

  /**
   * Actualiza una novedad existente.
   */
  async actualizarNovedad(id: string, novedad: Partial<Novedad>): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.NOVEDADES)
        .update({
          ...novedad,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error al actualizar novedad:', error);
        throw error;
      }

      console.log('✅ Novedad actualizada:', id);
    } catch (error) {
      console.error('❌ Error en actualizarNovedad:', error);
      throw error;
    }
  }

  /**
   * Elimina una novedad (soft delete).
   */
  async eliminarNovedad(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.NOVEDADES)
        .update({
          activo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error al eliminar novedad:', error);
        throw error;
      }

      console.log('✅ Novedad eliminada (soft delete):', id);
    } catch (error) {
      console.error('❌ Error en eliminarNovedad:', error);
      throw error;
    }
  }

  /**
   * Obtiene una novedad por ID
   */
  obtenerNovedadPorId(id: string): Observable<Novedad | null> {
    return from(supabase
      .from(TABLES.NOVEDADES)
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener novedad por ID:', error);
          return null;
        }
        return data;
      }),
      catchError(error => {
        console.error('❌ Error en obtenerNovedadPorId:', error);
        return from([null]);
      })
    );
  }

  /**
   * Obtiene novedades activas limitadas (para mostrar en home)
   */
  getNovedadesActivas(limite: number = 5): Observable<Novedad[]> {
    return from(supabase
      .from(TABLES.NOVEDADES)
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(limite)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener novedades activas:', error);
          throw error;
        }
        console.log(`✅ Novedades activas obtenidas: ${data?.length || 0}/${limite}`);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en getNovedadesActivas:', error);
        throw error;
      })
    );
  }
}
