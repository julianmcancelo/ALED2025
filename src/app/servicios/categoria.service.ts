import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { supabase, TABLES } from '../config/supabase.config';

/**
 * @interface Categoria
 * Define la estructura de un objeto de categoría.
 */
export interface Categoria {
  id?: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * @class CategoriaService
 * Servicio para gestionar las categorías en Supabase.
 * Proporciona métodos para crear, leer, actualizar y eliminar categorías.
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriaService {

  constructor() {
    console.log('📂 Inicializando CategoriaService con Supabase...');
  }

  /**
   * Obtiene todas las categorías de la base de datos como un stream.
   * @returns Un Observable que emite un array de categorías.
   */
  obtenerCategorias(): Observable<Categoria[]> {
    return from(supabase
      .from(TABLES.CATEGORIAS)
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener categorías:', error);
          throw error;
        }
        console.log('✅ Categorías obtenidas:', data?.length || 0);
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error en obtenerCategorias:', error);
        throw error;
      })
    );
  }

  /**
   * Crea una nueva categoría en la base de datos.
   * @param nombre - El nombre de la nueva categoría.
   * @returns Una promesa que se resuelve cuando la adición se completa.
   */
  async crearCategoria(nombre: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from(TABLES.CATEGORIAS)
        .insert([
          {
            nombre: nombre.trim(),
            activo: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error al crear categoría:', error);
        throw error;
      }

      console.log('✅ Categoría creada:', nombre);
      return data;
    } catch (error) {
      console.error('❌ Error en crearCategoria:', error);
      throw error;
    }
  }

  /**
   * Actualiza el nombre de una categoría existente.
   * @param id - El ID de la categoría a actualizar.
   * @param nombre - El nuevo nombre de la categoría.
   * @returns Una promesa que se resuelve cuando la actualización se completa.
   */
  async actualizarCategoria(id: string, nombre: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.CATEGORIAS)
        .update({ 
          nombre: nombre.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error al actualizar categoría:', error);
        throw error;
      }

      console.log('✅ Categoría actualizada:', id);
    } catch (error) {
      console.error('❌ Error en actualizarCategoria:', error);
      throw error;
    }
  }

  /**
   * Elimina una categoría de la base de datos (soft delete).
   * @param id - El ID de la categoría a eliminar.
   * @returns Una promesa que se resuelve cuando la eliminación se completa.
   */
  async eliminarCategoria(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.CATEGORIAS)
        .update({ 
          activo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error al eliminar categoría:', error);
        throw error;
      }

      console.log('✅ Categoría eliminada (soft delete):', id);
    } catch (error) {
      console.error('❌ Error en eliminarCategoria:', error);
      throw error;
    }
  }

  /**
   * Obtiene una categoría por ID
   * @param id - El ID de la categoría
   * @returns Observable con la categoría o null
   */
  obtenerCategoriaPorId(id: string): Observable<Categoria | null> {
    return from(supabase
      .from(TABLES.CATEGORIAS)
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error al obtener categoría por ID:', error);
          return null;
        }
        return data;
      }),
      catchError(error => {
        console.error('❌ Error en obtenerCategoriaPorId:', error);
        return from([null]);
      })
    );
  }
}
