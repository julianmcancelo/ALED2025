import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  fechaCreacion: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private novedadesCollection;

  constructor() {
    // Inicializar la colección en el constructor
    this.novedadesCollection = collection(this.firestore, 'novedades');
  }

  /**
   * Obtiene todas las novedades ordenadas por fecha de creación.
   */
  getNovedades(): Observable<Novedad[]> {
    return runInInjectionContext(this.injector, () => {
      const q = query(this.novedadesCollection, orderBy('fechaCreacion', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<Novedad[]>;
    });
  }

  /**
   * Crea una nueva novedad.
   */
  crearNovedad(novedad: Omit<Novedad, 'id' | 'fechaCreacion'>): Promise<any> {
    return runInInjectionContext(this.injector, () => {
      const nuevaNovedad = {
        ...novedad,
        fechaCreacion: new Date()
      };
      return addDoc(this.novedadesCollection, nuevaNovedad);
    });
  }

  /**
   * Actualiza una novedad existente.
   */
  actualizarNovedad(id: string, novedad: Partial<Novedad>): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const novedadDocRef = doc(this.firestore, `novedades/${id}`);
      return updateDoc(novedadDocRef, novedad);
    });
  }

  /**
   * Elimina una novedad.
   */
  eliminarNovedad(id: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const novedadDocRef = doc(this.firestore, `novedades/${id}`);
      return deleteDoc(novedadDocRef);
    });
  }
}
