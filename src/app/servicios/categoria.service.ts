import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/**
 * @interface Categoria
 * Define la estructura de un objeto de categoría.
 */
export interface Categoria {
  id?: string; // El ID del documento de Firestore
  nombre: string;
}

/**
 * @class CategoriaService
 * Proporciona métodos para gestionar las categorías de productos en Firestore.
 */
@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private firestore: Firestore = inject(Firestore);
  private injector: Injector = inject(Injector);

  // --- MÉTODOS CRUD ---

  /**
   * Obtiene todas las categorías disponibles.
   * @returns Un Observable que emite un array de categorías.
   */
  obtenerCategorias(): Observable<Categoria[]> {
    return runInInjectionContext(this.injector, () => {
      console.log('📁 Obteniendo categorías de Firestore...');
      const categoriasCollection = collection(this.firestore, 'categorias');
      const categorias$ = collectionData(categoriasCollection, { idField: 'id' }) as Observable<Categoria[]>;

      // Agregar logging para debugging
      categorias$.subscribe({
        next: (categorias) => {
          console.log('✅ Categorías obtenidas:', categorias);
          console.log('📊 Total de categorías:', categorias.length);
        },
        error: (error) => {
          console.error('❌ Error al obtener categorías:', error);
        }
      });

      return categorias$;
    });
  }

  /**
   * Crea una nueva categoría.
   * @param nombre - El nombre de la categoría.
   * @returns Una promesa que se resuelve cuando la categoría se ha creado.
   */
  async crearCategoria(nombre: string): Promise<any> {
    return runInInjectionContext(this.injector, async () => {
      console.log('🏷️ Creando categoría:', nombre);
      const categoriasCollection = collection(this.firestore, 'categorias');
      const result = await addDoc(categoriasCollection, { 
        nombre,
        activo: true,
        fechaCreacion: new Date()
      });
      console.log('✅ Categoría creada con ID:', result.id);
      return result;
    });
  }

  /**
   * Actualiza el nombre de una categoría existente.
   * @param id - El ID de la categoría a actualizar.
   * @param nombre - El nuevo nombre para la categoría.
   * @returns Una promesa que se resuelve cuando la actualización se completa.
   */
  actualizarCategoria(id: string, nombre: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const categoriaDocRef = doc(this.firestore, `categorias/${id}`);
      return updateDoc(categoriaDocRef, { nombre });
    });
  }

  /**
   * Elimina una categoría de Firestore.
   * @param id - El ID de la categoría a eliminar.
   * @returns Una promesa que se resuelve cuando la eliminación se completa.
   */
  eliminarCategoria(id: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const categoriaDocRef = doc(this.firestore, `categorias/${id}`);
      return deleteDoc(categoriaDocRef);
    });
  }

  /**
   * Método para crear categorías de ejemplo si no existen
   */
  async crearCategoriasDeEjemplo(): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      console.log('🛠️ Creando categorías de ejemplo...');
      
      const categoriasEjemplo = [
        'Electrónicos',
        'Ropa',
        'Hogar',
        'Deportes',
        'Belleza',
        'Libros',
        'Juguetes',
        'Automotor',
        'Salud'
      ];
      
      for (const categoria of categoriasEjemplo) {
        try {
          await this.crearCategoria(categoria);
        } catch (error) {
          console.error(`❌ Error creando categoría ${categoria}:`, error);
        }
      }
      
      console.log('✅ Categorías de ejemplo creadas');
    });
  }

  /**
   * Método para verificar y crear categorías si no existen
   */
  async verificarYCrearCategorias(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔍 Verificando categorías existentes...');
      
      this.obtenerCategorias().subscribe({
        next: async (categorias) => {
          console.log(`📊 Categorías encontradas: ${categorias.length}`);
          
          if (categorias.length === 0) {
            console.log('📁 No hay categorías, creando ejemplos...');
            try {
              await this.crearCategoriasDeEjemplo();
              console.log('✅ Categorías de ejemplo creadas exitosamente');
            } catch (error) {
              console.error('❌ Error creando categorías de ejemplo:', error);
            }
          } else {
            console.log(`✅ Ya existen ${categorias.length} categorías`);
          }
          resolve();
        },
        error: (error) => {
          console.error('❌ Error verificando categorías:', error);
          console.error('❌ Detalles del error:', {
            message: error.message,
            code: error.code,
            stack: error.stack
          });
          resolve();
        }
      });
    });
  }

  /**
   * Método simple para crear categorías sin verificación previa
   */
  async crearCategoriasDirecto(): Promise<void> {
    console.log('🚀 Creando categorías directamente...');
    
    const categoriasEjemplo = [
      'Electrónicos',
      'Ropa', 
      'Hogar',
      'Deportes',
      'Belleza'
    ];
    
    for (const categoria of categoriasEjemplo) {
      try {
        const result = await this.crearCategoria(categoria);
        console.log(`✅ Categoría '${categoria}' creada con ID:`, result.id);
      } catch (error) {
        console.error(`❌ Error creando categoría '${categoria}':`, error);
      }
    }
  }

  /**
   * Método de prueba para verificar conexión con Firestore
   */
  async probarConexion(): Promise<void> {
    console.log('🔌 Probando conexión con Firestore...');
    
    try {
      // Intentar crear una categoría de prueba
      const result = await this.crearCategoria('Prueba-' + Date.now());
      console.log('✅ Conexión exitosa, categoría de prueba creada:', result.id);
      
      // Eliminar la categoría de prueba
      await this.eliminarCategoria(result.id);
      console.log('✅ Categoría de prueba eliminada');
      
    } catch (error) {
      console.error('❌ Error de conexión con Firestore:', error);
    }
  }
}
