import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

/**
 * Interfaz que define la estructura de un producto en el sistema
 * Incluye todos los campos necesarios para la gestión completa de productos
 */
export interface Producto {
  id?: string; // ID único del producto (generado por Firebase)
  nombre: string; // Nombre del producto
  descripcion?: string; // Descripción detallada del producto
  precio: number; // Precio del producto en la moneda local
  categoria: string; // Categoría a la que pertenece el producto
  stock?: number; // Cantidad disponible en inventario
  imagen?: string; // URL de la imagen del producto
  activo: boolean; // Estado del producto (activo/inactivo)
  fechaCreacion?: Date; // Fecha de creación del producto
  fechaActualizacion?: Date; // Fecha de última actualización
}

/**
 * Servicio para la gestión completa de productos
 * Maneja todas las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de productos
 * Integrado con Firebase/Firestore para persistencia de datos
 */
@Injectable({
  providedIn: 'root',
})
export class GestionProductosService {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private firestore: Firestore = inject(Firestore);
  private injector: Injector = inject(Injector);
  private productosCollection = collection(this.firestore, 'productos');
  private inicializacionCompleta: Promise<void>;

  constructor() {
    // Verificar y crear la colección automáticamente al inicializar el servicio
    this.inicializacionCompleta = this.verificarYCrearColeccion().catch((error) => {
      console.error('Error durante la inicialización del servicio:', error);
      // Incluso si hay error, permitimos continuar
      return Promise.resolve();
    });
  }

  /**
   * Verifica si la colección de productos existe y la crea si no existe
   * También inicializa con datos de ejemplo si está vacía
   * @private
   */
  private async verificarYCrearColeccion(): Promise<void> {
    try {
      console.log('🔍 Verificando colección de productos en Firestore...');

      // Intentamos obtener los documentos de la colección
      const snapshot = await getDocs(this.productosCollection);

      if (snapshot.empty) {
        console.log(
          '📦 Colección de productos vacía o no encontrada. Inicializando con datos de ejemplo...',
        );
        await this.inicializarColeccionConDatosEjemplo();
        console.log('✅ Colección de productos inicializada correctamente.');
      } else {
        console.log(
          `✅ Colección de productos encontrada con ${snapshot.size} productos existentes.`,
        );

        // Mostrar información de los productos existentes
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          console.log(`📄 Producto existente: ${data['nombre']} (ID: ${doc.id})`);
        });
      }
    } catch (error) {
      console.error('❌ Error al verificar la colección de productos:', error);
      console.error('Detalles del error:', error);

      // Si hay error, intentamos crear la colección con datos de ejemplo
      console.log('🔄 Intentando crear colección con datos de ejemplo como fallback...');
      try {
        await this.inicializarColeccionConDatosEjemplo();
        console.log('✅ Colección creada como fallback.');
      } catch (fallbackError) {
        console.error(
          '❌ Error crítico: No se pudo crear la colección de productos:',
          fallbackError,
        );
        throw fallbackError;
      }
    }
  }

  /**
   * Inicializa la colección de productos con datos de ejemplo
   * @private
   */
  private async inicializarColeccionConDatosEjemplo(): Promise<void> {
    const productosEjemplo: Producto[] = [
      {
        nombre: 'Producto de Ejemplo 1',
        descripcion: 'Este es un producto de ejemplo creado automáticamente',
        precio: 29.99,
        categoria: 'Electrónicos',
        stock: 10,
        imagen: 'https://via.placeholder.com/300x200?text=Producto+1',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Producto de Ejemplo 2',
        descripcion: 'Otro producto de ejemplo para demostrar la funcionalidad',
        precio: 49.99,
        categoria: 'Hogar',
        stock: 5,
        imagen: 'https://via.placeholder.com/300x200?text=Producto+2',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Producto de Ejemplo 3',
        descripcion: 'Tercer producto de ejemplo con stock agotado',
        precio: 19.99,
        categoria: 'Ropa',
        stock: 0,
        imagen: 'https://via.placeholder.com/300x200?text=Producto+3',
        activo: false,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
    ];

    try {
      // Creamos cada producto de ejemplo
      for (const producto of productosEjemplo) {
        await addDoc(this.productosCollection, producto);
      }
      console.log('Colección de productos inicializada con datos de ejemplo.');
    } catch (error) {
      console.error('Error al inicializar la colección con datos de ejemplo:', error);
    }
  }

  /**
   * Método de prueba para verificar la conexión con Firestore
   * @returns Promise que resuelve cuando la conexión es exitosa
   */
  async probarConexionFirestore(): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log('🧪 Iniciando prueba de conexión con Firestore...');

        // Esperamos a que la inicialización se complete
        await this.inicializacionCompleta;
        console.log('✅ Inicialización completada');

        // Intentamos leer la colección
        const snapshot = await getDocs(this.productosCollection);
        console.log(`📊 Conexión exitosa. Productos encontrados: ${snapshot.size}`);

        // Mostramos los productos encontrados
        let index = 0;
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          index++;
          console.log(`${index}. ${data['nombre']} - $${data['precio']} (Stock: ${data['stock']})`);
        });

        return true;
      } catch (error) {
        console.error('❌ Error en la prueba de conexión:', error);
        return false;
      }
    });
  }

  /**
   * Obtiene todos los productos almacenados en la base de datos
   * @returns Observable con array de productos
   */
  obtenerProductos(): Observable<Producto[]> {
    console.log('🔄 Iniciando obtención de productos...');

    // Esperamos a que la inicialización se complete antes de leer datos
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        try {
          console.log('✅ Inicialización completa, obteniendo productos desde Firestore...');

          // Obtenemos todos los productos
          const productosRef = collection(this.firestore, 'productos');

          // Retornamos un observable que se actualiza en tiempo real
          return collectionData(productosRef, { idField: 'id' }) as Observable<Producto[]>;
        } catch (error) {
          console.error('❌ Error al obtener productos:', error);
          // En caso de error, retornamos un observable vacío
          return of([]);
        }
      }),
      catchError((error) => {
        console.error('❌ Error durante la inicialización o lectura:', error);
        return of([]);
      }),
    );
  }

  /**
   * Obtiene un producto específico por su ID
   * @param id - ID único del producto a buscar
   * @returns Observable con el producto encontrado o null si no existe
   */
  obtenerProductoPorId(id: string): Observable<Producto | null> {
    // TODO: Implementar lógica para obtener un producto específico
    // Ejemplo de implementación:
    // const productoRef = doc(this.firestore, `productos/${id}`);
    // return docData(productoRef, { idField: 'id' }) as Observable<Producto>;
    throw new Error(
      'Método obtenerProductoPorId() no implementado - Pendiente configuración de Firestore',
    );
  }

  /**
   * Crea un nuevo producto en la base de datos
   * @param producto - Datos del producto a crear
   * @returns Observable con el ID del producto creado
   */
  crearProducto(producto: Producto): Observable<string> {
    try {
      // Preparamos el producto con fechas de creación y actualización
      const nuevoProducto = {
        ...producto,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };

      // Creamos el documento y retornamos el ID
      return from(
        addDoc(this.productosCollection, nuevoProducto).then((docRef) => {
          console.log('Producto creado con ID:', docRef.id);
          return docRef.id;
        }),
      );
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  }

  /**
   * Actualiza un producto existente en la base de datos
   * @param id - ID del producto a actualizar
   * @param producto - Datos parciales del producto a actualizar
   * @returns Observable que se completa cuando la actualización termina
   */
  actualizarProducto(id: string, producto: Partial<Producto>): Observable<void> {
    try {
      // Referencia al documento específico
      const productoRef = doc(this.firestore, `productos/${id}`);

      // Preparamos los datos con fecha de actualización
      const datosActualizacion = {
        ...producto,
        fechaActualizacion: new Date(),
      };

      // Actualizamos el documento
      return from(
        updateDoc(productoRef, datosActualizacion).then(() => {
          console.log('Producto actualizado con ID:', id);
        }),
      );
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  }

  /**
   * Elimina un producto de la base de datos
   * @param id - ID del producto a eliminar
   * @returns Observable que se completa cuando la eliminación termina
   */
  eliminarProducto(id: string): Observable<void> {
    try {
      // Referencia al documento específico
      const productoRef = doc(this.firestore, `productos/${id}`);

      // Eliminamos el documento
      return from(
        deleteDoc(productoRef).then(() => {
          console.log('Producto eliminado con ID:', id);
        }),
      );
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos filtrados por categoría específica
   * @param categoria - Nombre de la categoría a filtrar
   * @returns Observable con array de productos de la categoría especificada
   */
  obtenerProductosPorCategoria(categoria: string): Observable<Producto[]> {
    // TODO: Implementar lógica para filtrar productos por categoría
    // Ejemplo de implementación:
    // const productosRef = collection(this.firestore, 'productos');
    // const q = query(productosRef, where('categoria', '==', categoria));
    // return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
    throw new Error(
      'Método obtenerProductosPorCategoria() no implementado - Pendiente configuración de Firestore',
    );
  }

  /**
   * Busca productos por nombre o descripción
   * @param termino - Término de búsqueda
   * @returns Observable con array de productos que coinciden con la búsqueda
   */
  buscarProductos(termino: string): Observable<Producto[]> {
    // TODO: Implementar lógica de búsqueda de productos
    // Nota: Firestore no soporta búsqueda de texto completo nativamente
    // Se puede implementar usando Algolia o similar para búsquedas avanzadas
    throw new Error(
      'Método buscarProductos() no implementado - Pendiente configuración de búsqueda',
    );
  }

  /**
   * Obtiene únicamente los productos que están marcados como activos
   * @returns Observable con array de productos activos
   */
  obtenerProductosActivos(): Observable<Producto[]> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        const productosRef = collection(this.firestore, 'productos');
        const q = query(productosRef, where('activo', '==', true));
        return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener productos activos:', error);
        return of([]);
      }),
    );
  }

  /**
   * Actualiza el stock de un producto específico
   * @param id - ID del producto
   * @param nuevoStock - Nueva cantidad de stock
   * @returns Observable que se completa cuando la actualización termina
   */
  actualizarStock(id: string, nuevoStock: number): Observable<void> {
    // Validamos que el stock no sea negativo
    if (nuevoStock < 0) {
      throw new Error('El stock no puede ser negativo');
    }

    // Utilizamos el método actualizarProducto para actualizar solo el stock
    return this.actualizarProducto(id, { stock: nuevoStock });
  }

  /**
   * Cambia el estado activo/inactivo de un producto
   * @param id - ID del producto
   * @param activo - Nuevo estado del producto
   * @returns Observable que se completa cuando la actualización termina
   */
  cambiarEstadoProducto(id: string, activo: boolean): Observable<void> {
    // Utilizamos el método actualizarProducto para cambiar el estado
    return this.actualizarProducto(id, { activo });
  }
}
