import { Injectable, inject } from '@angular/core';
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

  // --- REFERENCIA A LA COLECCIÓN ---
  /**
   * Referencia a la colección 'categorias' en Firestore.
   */
  private categoriasCollection = collection(this.firestore, 'categorias');

  // --- MÉTODOS CRUD ---

  /**
   * Obtiene todas las categorías en tiempo real.
   * @returns Un Observable que emite un array de categorías cada vez que hay cambios.
   */
  obtenerCategorias(): Observable<Categoria[]> {
    // collectionData con idField nos devuelve un observable que se actualiza automáticamente.
    return collectionData(this.categoriasCollection, {
      idField: 'id',
    }) as Observable<Categoria[]>;
  }

  /**
   * Crea una nueva categoría en Firestore.
   * @param nombre - El nombre de la nueva categoría.
   * @returns Una promesa que se resuelve con la referencia al nuevo documento.
   */
  crearCategoria(nombre: string): Promise<any> {
    return addDoc(this.categoriasCollection, { nombre });
  }

  /**
   * Actualiza el nombre de una categoría existente.
   * @param id - El ID de la categoría a actualizar.
   * @param nombre - El nuevo nombre para la categoría.
   * @returns Una promesa que se resuelve cuando la actualización se completa.
   */
  actualizarCategoria(id: string, nombre: string): Promise<void> {
    const categoriaDocRef = doc(this.firestore, `categorias/${id}`);
    return updateDoc(categoriaDocRef, { nombre });
  }

  /**
   * Elimina una categoría de Firestore.
   * @param id - El ID de la categoría a eliminar.
   * @returns Una promesa que se resuelve cuando la eliminación se completa.
   */
  eliminarCategoria(id: string): Promise<void> {
    const categoriaDocRef = doc(this.firestore, `categorias/${id}`);
    return deleteDoc(categoriaDocRef);
  }
}
