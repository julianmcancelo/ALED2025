/**
 * ============================================================================
 * SERVICIO DEL CARRITO DE COMPRAS
 * ============================================================================
 * 
 * Este servicio gestiona todo el estado y las operaciones del carrito de compras.
 * Utiliza SIGNALS de Angular (nueva API desde v16) para manejar el estado
 * de forma reactiva y eficiente.
 * 
 * Características principales:
 * - Estado reactivo con Signals
 * - Cálculos automáticos con Computed Signals
 * - Persistencia en localStorage (implementada en el componente)
 * - Operaciones CRUD sobre el carrito
 * 
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * ============================================================================
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { ResenasService } from './resenas.service';

/**
 * Interfaz que define la estructura de un producto.
 * 
 * TypeScript usa estas interfaces para:
 * - Validar tipos en tiempo de compilación
 * - Autocompletado en el IDE
 * - Documentación del código
 */
export interface Producto {
  id?: string;        // ID único del producto (opcional para flexibilidad)
  nombre: string;     // Nombre del producto
  precio: number;     // Precio en pesos argentinos
  imagen?: string;    // URL de la imagen (opcional)
}

/**
 * Interfaz que define un elemento dentro del carrito.
 * 
 * Un elemento del carrito combina:
 * - El producto completo (con todos sus datos)
 * - La cantidad de ese producto que el usuario quiere comprar
 */
export interface ElementoCarrito {
  producto: Producto;  // El producto completo
  cantidad: number;    // Cuántas unidades quiere el usuario
}

/**
 * Servicio Injectable que gestiona el carrito de compras.
 * 
 * @Injectable({ providedIn: 'root' }) significa:
 * - Es un Singleton (una sola instancia en toda la app)
 * - Se puede inyectar en cualquier componente
 * - Angular gestiona su ciclo de vida automáticamente
 * 
 * VENTAJAS DE USAR SIGNALS:
 * 1. Rendimiento: Solo se actualizan los componentes que usan el signal
 * 2. Simplicidad: Más fácil que RxJS para casos simples
 * 3. Type-safe: TypeScript valida los tipos
 * 4. Computed: Cálculos automáticos derivados
 */
@Injectable({
  providedIn: 'root',  // Singleton a nivel de aplicación
})
export class CarritoService {
  
  // ========================================================================
  // INYECCIÓN DE DEPENDENCIAS
  // ========================================================================
  
  private resenasService = inject(ResenasService);
  
  // ========================================================================
  // CONSTANTES
  // ========================================================================
  
  private readonly CARRITO_STORAGE_KEY = 'aled2025_carrito';
  
  // ========================================================================
  // SIGNALS DE ESTADO
  // ========================================================================
  
  /**
   * Signal que contiene todos los items del carrito.
   * 
   * Un Signal es como una "caja" que contiene un valor y notifica
   * automáticamente cuando ese valor cambia.
   * 
   * Para leer el valor: this.items()
   * Para modificar: this.items.set([...]) o this.items.update(fn)
   * 
   * Inicializado con array vacío: []
   */
  items = signal<ElementoCarrito[]>([]);
  
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  constructor() {
    this.cargarCarritoDesdeStorage();
  }
  
  /**
   * Método de prueba para agregar productos de ejemplo al carrito
   */
  agregarProductosDePrueba(): void {
    const productosPrueba: Producto[] = [
      {
        id: 'test-1',
        nombre: 'Mate de Calabaza Premium',
        precio: 15000,
        imagen: 'https://via.placeholder.com/150x150/0077b6/ffffff?text=Mate'
      },
      {
        id: 'test-2', 
        nombre: 'Bombilla de Alpaca',
        precio: 8500,
        imagen: 'https://via.placeholder.com/150x150/28a745/ffffff?text=Bombilla'
      },
      {
        id: 'test-3',
        nombre: 'Yerba Mate Orgánica 1kg',
        precio: 3200,
        imagen: 'https://via.placeholder.com/150x150/dc3545/ffffff?text=Yerba'
      }
    ];
    
    productosPrueba.forEach(producto => {
      this.agregarProducto(producto);
    });
  }

  // ========================================================================
  // COMPUTED SIGNALS (Señales Computadas)
  // ========================================================================
  
  /**
   * Computed Signal que calcula el total de items en el carrito.
   * 
   * CÓMO FUNCIONA:
   * 1. Lee el signal 'items'
   * 2. Suma todas las cantidades
   * 3. Se recalcula AUTOMÁTICAMENTE cuando 'items' cambia
   * 4. Es de solo lectura (no se puede modificar directamente)
   * 
   * Ejemplo: Si tengo 2 productos con cantidad 3 y 5 → totalItems = 8
   * 
   * VENTAJA: No necesitamos actualizar manualmente este valor,
   * Angular lo hace por nosotros cuando 'items' cambia.
   */
  totalItems = computed(() => 
    this.items().reduce((total, item) => total + item.cantidad, 0)
  );

  /**
   * Computed Signal que calcula el precio total del carrito.
   * 
   * CÓMO FUNCIONA:
   * 1. Lee el signal 'items'
   * 2. Para cada item: multiplica precio × cantidad
   * 3. Suma todos los resultados
   * 4. Se recalcula AUTOMÁTICAMENTE cuando 'items' cambia
   * 
   * Ejemplo:
   * - Producto A: $100 × 2 unidades = $200
   * - Producto B: $50 × 3 unidades = $150
   * - Total: $350
   * 
   * Este valor se usa en:
   * - Vista del carrito
   * - Resumen de compra
   * - Integración con Mercado Pago
   */
  totalPrecio = computed(() =>
    this.items().reduce((total, item) => 
      total + (item.producto.precio * item.cantidad), 0
    )
  );

  // ========================================================================
  // MÉTODOS PÚBLICOS - Operaciones sobre el carrito
  // ========================================================================

  /**
   * Agrega un producto al carrito.
   * 
   * LÓGICA:
   * 1. Busca si el producto ya existe en el carrito (por ID)
   * 2. Si existe: incrementa su cantidad en 1
   * 3. Si no existe: lo agrega con cantidad 1
   * 4. Guarda el carrito en localStorage
   * 
   * EJEMPLO DE USO:
   * ```typescript
   * const producto = { id: '123', nombre: 'Mate', precio: 8000 };
   * this.carritoService.agregarProducto(producto);
   * ```
   * 
   * @param producto - El producto que se va a agregar
   */
  agregarProducto(producto: Producto): void {
    // Buscamos si el producto ya está en el carrito
    // find() devuelve el elemento si lo encuentra, o undefined si no
    const itemExistente = this.items().find(item => item.producto.id === producto.id);
    
    if (itemExistente) {
      // CASO 1: El producto YA está en el carrito
      // Incrementamos su cantidad usando update()
      
      this.items.update((items) =>
        items.map((item) =>
          item.producto.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 }  // Incrementar cantidad
            : item                                       // Dejar igual
        )
      );
    } else {
      // CASO 2: El producto NO está en el carrito
      // Lo agregamos como nuevo elemento con cantidad 1
      
      this.items.update((items) => [
        ...items,                          // Items existentes
        { producto, cantidad: 1 }          // Nuevo item
      ]);
    }
    
    // Guardar en localStorage después de cada cambio
    this.guardarCarritoEnStorage();
  }

  /**
   * Elimina un producto completamente del carrito.
   * 
   * IMPORTANTE: Elimina el producto sin importar su cantidad.
   * Si el usuario tenía 5 unidades, se eliminan todas.
   * 
   * EJEMPLO DE USO:
   * ```typescript
   * this.carritoService.eliminarProducto('123');
   * ```
   * 
   * @param idProducto - El ID del producto a eliminar
   */
  eliminarProducto(idProducto: string): void {
    // Usamos filter() para crear un nuevo array que:
    // - Incluye todos los items EXCEPTO el que queremos eliminar
    this.items.update(items => items.filter(item => item.producto.id !== idProducto));
    
    // Guardar en localStorage después del cambio
    this.guardarCarritoEnStorage();
  }

  /**
   * Vacía completamente el carrito de compras.
   * 
   * Elimina todos los productos del carrito de una sola vez.
   * Útil para:
   * - Después de completar una compra
   * - Cuando el usuario quiere empezar de cero
   * - Limpiar el carrito al cerrar sesión
   * 
   * EJEMPLO DE USO:
   * ```typescript
   * this.carritoService.vaciarCarrito();
   * ```
   */
  vaciarCarrito(): void {
    // Usamos set() para reemplazar todo el contenido con un array vacío
    // set() es más directo que update() cuando queremos reemplazar todo
    this.items.set([]);
    
    // Limpiar localStorage
    this.guardarCarritoEnStorage();
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS - Persistencia en localStorage
  // ========================================================================
  
  /**
   * Carga el carrito desde localStorage al inicializar el servicio.
   */
  private cargarCarritoDesdeStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const carritoGuardado = localStorage.getItem(this.CARRITO_STORAGE_KEY);
        if (carritoGuardado) {
          const items = JSON.parse(carritoGuardado) as ElementoCarrito[];
          this.items.set(items);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando carrito desde localStorage:', error);
      this.items.set([]);
    }
  }
  
  /**
   * Guarda el carrito actual en localStorage.
   */
  private guardarCarritoEnStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const items = this.items();
        localStorage.setItem(this.CARRITO_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('❌ Error guardando carrito en localStorage:', error);
    }
  }

  /**
   * Registra una venta exitosa e incrementa las estadísticas del vendedor
   */
  async registrarVentaExitosa(): Promise<void> {
    try {
      const cantidadItems = this.totalItems();
      if (cantidadItems > 0) {
        // Incrementar las ventas en las estadísticas del vendedor
        await this.resenasService.incrementarVentas(cantidadItems);
        console.log('✅ Venta registrada exitosamente:', cantidadItems, 'items');
      }
    } catch (error) {
      console.error('❌ Error registrando venta:', error);
    }
  }
}

