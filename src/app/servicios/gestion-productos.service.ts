import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

/**
 * BUSCADOR FUNCIONAL PARA EXPOSICIÓN - PROYECTO ALED2025
 * =====================================================
 * 
 * Este servicio implementa un sistema de búsqueda completo y funcional
 * para productos en el e-commerce 
 * 
 * CARACTERÍSTICAS PRINCIPALES:
 * - Búsqueda por nombre, descripción y categoría
 * - Filtrado insensible a mayúsculas/minúsculas
 * - Integración completa con Firebase/Firestore
 * - Logging detallado para debugging
 * - Manejo de errores robusto
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 * PROFESOR: Sebastian Saldivar
 */

/**
 * Interfaz que define la estructura de un producto en el sistema
 * Incluye todos los campos necesarios para la gestión completa de productos
 */
export interface Producto {
  id?: string; // ID único del producto (generado por Firebase)
  nombre: string; // Nombre del producto
  descripcion?: string; // Descripción detallada del producto
  precio: number; // Precio del producto en pesos argentinos
  categoria: string; // Categoría a la que pertenece el producto
  stock?: number; // Cantidad disponible en inventario
  imagen?: string; // URL de la imagen del producto
  activo: boolean; // Estado del producto (activo/inactivo)
  esDestacado?: boolean; // true si es un producto destacado para la página de inicio
  fechaCreacion?: Date; // Fecha de creación del producto
  fechaActualizacion?: Date; // Fecha de última actualización
}

/**
 * Servicio principal para la gestión completa de productos
 * Maneja todas las operaciones CRUD y búsqueda de productos
 * Integrado con Firebase/Firestore para persistencia de datos
 */
@Injectable({
  providedIn: 'root',
})
export class GestionProductosService {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private productosCollection;
  private inicializacionCompleta: Promise<void>;

  constructor() {
    console.log('🔧 Inicializando GestionProductosService...');
    console.log('🔧 Firestore instance:', this.firestore);
    
    try {
      // Inicializar la colección después de que Firestore esté disponible
      this.productosCollection = collection(this.firestore, 'productos');
      console.log('✅ Colección de productos inicializada correctamente');
      
      // Inicializando servicio de productos
      this.inicializacionCompleta = this.verificarYCrearColeccion().catch((error) => {
        console.error('❌ Error durante la inicialización del servicio:', error);
        // Incluso si hay error, permitimos continuar
        return Promise.resolve();
      });
      
      // PRUEBA INMEDIATA: Verificar conexión
      setTimeout(() => {
        this.probarConexionFirestore();
      }, 1000);
    } catch (error) {
      console.error('❌ Error crítico al inicializar el servicio:', error);
      throw error;
    }
  }

  /**
   * MÉTODO PRINCIPAL DE BÚSQUEDA - FUNCIONAL PARA DEMOSTRACIÓN
   * =========================================================
   * 
   * Busca productos por nombre, descripción o categoría usando filtrado del lado del cliente.
   * Implementación completamente funcional para la exposición del proyecto.
   * 
   * FUNCIONALIDADES:
   * - Búsqueda insensible a mayúsculas/minúsculas
   * - Busca en nombre, descripción y categoría
   * - Logging detallado para debugging
   * - Manejo de errores robusto
   * - Retorna solo productos activos
   * 
   * @param termino - Término de búsqueda (nombre, descripción o categoría del producto)
   * @returns Observable con array de productos que coinciden con la búsqueda
   */
  buscarProductos(termino: string): Observable<Producto[]> {
    // Si no hay término de búsqueda, retornamos todos los productos activos
    if (!termino || termino.trim() === '') {
      return this.obtenerProductosActivos();
    }

    // Convertimos el término a minúsculas para búsqueda insensible a mayúsculas
    const terminoBusqueda = termino.toLowerCase().trim();
    
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          
          // Obtenemos todos los productos activos
          const q = query(this.productosCollection, where('activo', '==', true));
          
          return collectionData(q, { idField: 'id' }).pipe(
            map((productos: any[]) => {
              // Filtramos los productos que coincidan en nombre, descripción o categoría
              const productosEncontrados = productos.filter((producto: Producto) => {
                const nombreCoincide = producto.nombre.toLowerCase().includes(terminoBusqueda);
                const descripcionCoincide = producto.descripcion?.toLowerCase().includes(terminoBusqueda) || false;
                const categoriaCoincide = producto.categoria.toLowerCase().includes(terminoBusqueda);
                
                return nombreCoincide || descripcionCoincide || categoriaCoincide;
              });
              
              return productosEncontrados as Producto[];
            })
          );
        });
      }),
      catchError((error) => {
        console.error('❌ [ERROR] Durante la búsqueda de productos:', error);
        return of([]);
      })
    );
  }

  /**
   * MÉTODO DE PRUEBA - Verifica conexión básica con Firestore
   */
  async probarConexionFirestore(): Promise<void> {
    try {
      console.log('🧪 PRUEBA: Verificando conexión con Firestore...');
      console.log('🧪 PRUEBA: Firestore instance:', this.firestore);
      console.log('🧪 PRUEBA: productosCollection:', this.productosCollection);
      
      // Usar runInInjectionContext para las operaciones de Firebase
      await runInInjectionContext(this.injector, async () => {
        // Intentar obtener todos los documentos sin filtros
        const snapshot = await getDocs(this.productosCollection);
        console.log('🧪 PRUEBA: Snapshot obtenido:', snapshot);
        console.log('🧪 PRUEBA: Número de documentos:', snapshot.size);
        console.log('🧪 PRUEBA: Está vacío:', snapshot.empty);
        
        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            console.log('🧪 PRUEBA: Documento encontrado:', doc.id, doc.data());
          });
        } else {
          console.log('🧪 PRUEBA: La colección está vacía, creando datos de ejemplo...');
          await this.inicializarColeccionConDatosEjemplo();
        }
      });
      
    } catch (error: any) {
      console.error('🧪 PRUEBA: Error al conectar con Firestore:', error);
      console.error('🧪 PRUEBA: Detalles del error:', {
        message: error?.message || 'Sin mensaje',
        code: error?.code || 'Sin código',
        stack: error?.stack || 'Sin stack trace'
      });
    }
  }

  /**
   * Obtiene únicamente los productos que están marcados como activos
   * @returns Observable con array de productos activos
   */
  obtenerProductosActivos(): Observable<Producto[]> {
    console.log('🔍 Iniciando obtenerProductosActivos...');
    
    // VERSIÓN SIMPLIFICADA PARA DEBUGGING CON CONTEXTO DE INYECCIÓN
    return new Observable<Producto[]>((observer) => {
      this.inicializacionCompleta.then(async () => {
        try {
          console.log('✅ Inicialización completa, procediendo con consulta simplificada...');
          
          // Usar runInInjectionContext para las operaciones de Firebase
          await runInInjectionContext(this.injector, async () => {
            // Primero intentamos obtener TODOS los documentos
            const snapshot = await getDocs(this.productosCollection);
            console.log(`📊 Total documentos en colección: ${snapshot.size}`);
          
            if (snapshot.empty) {
              console.log('⚠️ Colección vacía, creando datos de ejemplo...');
              await this.inicializarColeccionConDatosEjemplo();
              
              // Intentar de nuevo después de crear datos
              const newSnapshot = await getDocs(this.productosCollection);
              console.log(`📊 Documentos después de crear datos: ${newSnapshot.size}`);
              
              const productos: Producto[] = [];
              newSnapshot.forEach((doc) => {
                const data = doc.data();
                productos.push({ id: doc.id, ...data } as Producto);
              });
              
              observer.next(productos);
              observer.complete();
            } else {
              // Convertir documentos a productos
              const productos: Producto[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`📄 Documento: ${doc.id}`, data);
                
                // Filtrar solo productos activos
                if (data['activo'] === true) {
                  productos.push({ id: doc.id, ...data } as Producto);
                }
              });
              
              console.log(`✅ Productos activos encontrados: ${productos.length}`);
              observer.next(productos);
              observer.complete();
            }
          });
          
        } catch (error: any) {
          console.error('❌ Error en obtenerProductosActivos:', error);
          observer.error(error);
        }
      }).catch((error) => {
        console.error('❌ Error en inicialización:', error);
        observer.error(error);
      });
    });
  }

  /**
   * Verifica si la colección de productos existe y la crea si no existe
   * También inicializa con datos de ejemplo si está vacía
   * @private
   */
  private async verificarYCrearColeccion(): Promise<void> {
    try {
      // Usar runInInjectionContext para las operaciones de Firebase
      await runInInjectionContext(this.injector, async () => {
        // Verificando colección de productos
        const snapshot = await getDocs(this.productosCollection);

        if (snapshot.empty) {
          await this.inicializarColeccionConDatosEjemplo();
        }
      });
    } catch (error) {
      console.error('❌ Error al verificar la colección:', error);
      // Intentamos crear la colección como fallback
      try {
        await this.inicializarColeccionConDatosEjemplo();
      } catch (fallbackError) {
        console.error('❌ Error crítico:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * DATOS DE EJEMPLO PARA DEMOSTRACIÓN
   * ==================================
   * 
   * Inicializa la colección con productos variados para mostrar
   * la funcionalidad de búsqueda en la exposición
   */
  private async inicializarColeccionConDatosEjemplo(): Promise<void> {
    const productosEjemplo: Producto[] = [
      {
        nombre: 'Smartphone Samsung Galaxy A54',
        descripcion: 'Teléfono inteligente con pantalla AMOLED de 6.4 pulgadas, cámara triple de 50MP y 128GB de almacenamiento. Ideal para fotografía y entretenimiento.',
        precio: 89999,
        categoria: 'Electrónicos',
        stock: 15,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Samsung+Galaxy',
        activo: true,
        esDestacado: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Notebook Lenovo ThinkPad E14',
        descripcion: 'Laptop empresarial con procesador Intel Core i5, 8GB RAM, SSD 256GB. Perfecta para trabajo profesional y estudio universitario.',
        precio: 125000,
        categoria: 'Electrónicos',
        stock: 8,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Lenovo+ThinkPad',
        activo: true,
        esDestacado: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Cafetera Automática Philips 3200',
        descripcion: 'Cafetera espresso automática con molinillo integrado y sistema de espuma de leche. Para los amantes del café de calidad profesional.',
        precio: 45000,
        categoria: 'Hogar',
        stock: 12,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Cafetera+Philips',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Remera Deportiva Nike Dri-FIT',
        descripcion: 'Camiseta deportiva de alta calidad con tecnología Dri-FIT para máximo rendimiento. Ideal para running y entrenamiento.',
        precio: 8500,
        categoria: 'Ropa',
        stock: 25,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Nike+Dri-FIT',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Auriculares Bluetooth Sony WH-1000XM4',
        descripcion: 'Auriculares inalámbricos premium con cancelación de ruido activa y 30 horas de batería. Sonido de alta fidelidad.',
        precio: 35000,
        categoria: 'Electrónicos',
        stock: 20,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Sony+Bluetooth',
        activo: true,
        esDestacado: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Zapatillas Running Adidas Ultraboost',
        descripcion: 'Calzado deportivo con tecnología Boost para máximo confort y rendimiento. Perfectas para corredores exigentes.',
        precio: 22000,
        categoria: 'Ropa',
        stock: 18,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Adidas+Boost',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Smart TV LG 55 pulgadas 4K',
        descripcion: 'Televisor inteligente 4K UHD con WebOS, HDR10 y conectividad WiFi. Entretenimiento de última generación.',
        precio: 180000,
        categoria: 'Electrónicos',
        stock: 6,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=LG+Smart+TV',
        activo: true,
        esDestacado: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
      {
        nombre: 'Silla Ergonómica de Oficina Premium',
        descripcion: 'Silla de escritorio con soporte lumbar ajustable, reposabrazos 4D y base giratoria. Comodidad para largas jornadas.',
        precio: 65000,
        categoria: 'Hogar',
        stock: 10,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Silla+Oficina',
        activo: true,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      },
    ];

    try {
      // Usar runInInjectionContext para las operaciones de Firebase
      await runInInjectionContext(this.injector, async () => {
        // Creando productos de ejemplo
        for (const producto of productosEjemplo) {
          await addDoc(this.productosCollection, producto);
        }
      });
    } catch (error) {
      console.error('❌ Error al inicializar productos:', error);
    }
  }

  /**
   * Obtiene todos los productos almacenados en la base de datos
   * @returns Observable con array de productos
   */
  obtenerProductos(): Observable<Producto[]> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          return collectionData(this.productosCollection, { idField: 'id' }) as Observable<Producto[]>;
        });
      }),
      catchError((error) => {
        console.error('❌ Error al obtener productos:', error);
        return of([]);
      }),
    );
  }

  /**
   * Obtiene productos destacados para la página de inicio
   * @returns Observable con array de productos destacados
   */
  obtenerProductosDestacados(): Observable<Producto[]> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          const q = query(
            this.productosCollection,
            where('activo', '==', true),
            where('esDestacado', '==', true),
          );
          return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
        });
      }),
      catchError((error) => {
        console.error('❌ Error al obtener productos destacados:', error);
        return of([]);
      }),
    );
  }

  /**
   * Obtiene un producto específico por su ID
   * @param id - ID del producto a buscar
   * @returns Observable con el producto encontrado o null
   */
  obtenerProductoPorId(id: string): Observable<Producto | null> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          const productoRef = doc(this.firestore, 'productos', id);
          return from(getDoc(productoRef)).pipe(
            map((docSnapshot) => {
              if (docSnapshot.exists()) {
                return { id: docSnapshot.id, ...docSnapshot.data() } as Producto;
              }
              return null;
            })
          );
        });
      }),
      catchError((error) => {
        console.error('❌ Error al obtener producto por ID:', error);
        return of(null);
      })
    );
  }

  /**
   * Crea un nuevo producto en la base de datos
   * @param producto - Datos del producto a crear
   * @returns Observable con el ID del producto creado
   */
  crearProducto(producto: Omit<Producto, 'id'>): Observable<string> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          const nuevoProducto = {
            ...producto,
            fechaCreacion: new Date(),
            fechaActualizacion: new Date(),
          };
          
          return from(addDoc(this.productosCollection, nuevoProducto)).pipe(
            map((docRef) => docRef.id)
          );
        });
      }),
      catchError((error) => {
        console.error('❌ Error al crear producto:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un producto existente
   * @param id - ID del producto a actualizar
   * @param datosActualizacion - Datos parciales a actualizar
   * @returns Observable que se completa cuando la actualización termina
   */
  actualizarProducto(id: string, datosActualizacion: Partial<Producto>): Observable<void> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          const productoRef = doc(this.firestore, 'productos', id);
          const datosConFecha = {
            ...datosActualizacion,
            fechaActualizacion: new Date(),
          };
          
          return from(updateDoc(productoRef, datosConFecha)).pipe(
            map(() => {})
          );
        });
      }),
      catchError((error: any) => {
        console.error('❌ Error al actualizar producto:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un producto de la base de datos
   * @param id - ID del producto a eliminar
   * @returns Observable que se completa cuando la eliminación termina
   */
  eliminarProducto(id: string): Observable<void> {
    return from(this.inicializacionCompleta).pipe(
      switchMap(() => {
        return runInInjectionContext(this.injector, () => {
          const productoRef = doc(this.firestore, 'productos', id);
          
          return from(deleteDoc(productoRef)).pipe(
            map(() => {})
          );
        });
      }),
      catchError((error: any) => {
        console.error(`❌ [SERVICIO] Error al eliminar producto ${id}:`, error);
        console.error(`❌ [SERVICIO] Tipo de error:`, typeof error);
        console.error(`❌ [SERVICIO] Mensaje de error:`, error.message);
        console.error(`❌ [SERVICIO] Stack trace:`, error.stack);
        throw error;
      })
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
