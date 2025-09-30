import { Injectable, signal, computed } from '@angular/core';

/**
 * @interface Producto
 * Define la estructura de un objeto de producto.
 * Esto nos ayuda a asegurar que todos los productos tengan la misma forma.
 */
export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen: string; // URL de la imagen del producto
}

/**
 * @interface ElementoCarrito
 * Define la estructura de un elemento dentro del carrito.
 * Contiene el producto y la cantidad de ese producto.
 */
export interface ElementoCarrito {
  producto: Producto;
  cantidad: number;
}

/**
 * @class CarritoService
 * Servicio para gestionar el estado y las operaciones del carrito de compras.
 * Utiliza Angular Signals para manejar el estado de forma reactiva, lo que
 * significa que cualquier cambio se reflejará automáticamente en la interfaz.
 */
@Injectable({
  providedIn: 'root', // Esto hace que el servicio esté disponible en toda la aplicación.
})
export class CarritoService {
  // --- SEÑALES DE ESTADO ---

  /**
   * @signal items
   * Almacena la lista de elementos (productos y su cantidad) en el carrito.
   * Es la fuente principal de verdad para el estado del carrito.
   * La inicializamos con un array vacío.
   */
  items = signal<ElementoCarrito[]>([]);

  // --- SEÑALES COMPUTADAS ---
  // Son señales de solo lectura que derivan su valor de otras señales.

  /**
   * @computed totalItems
   * Calcula la cantidad total de productos en el carrito.
   * Suma las 'cantidades' de todos los elementos.
   * Se actualiza automáticamente cada vez que la señal 'items' cambia.
   */
  totalItems = computed(() =>
    this.items().reduce((total, item) => total + item.cantidad, 0)
  );

  /**
   * @computed totalPrecio
   * Calcula el precio total de todos los productos en el carrito.
   * Multiplica el precio de cada producto por su cantidad y suma los resultados.
   * Se actualiza automáticamente cada vez que la señal 'items' cambia.
   */
  totalPrecio = computed(() =>
    this.items().reduce(
      (total, item) => total + item.producto.precio * item.cantidad,
      0
    )
  );

  // --- MÉTODOS PÚBLICOS ---

  /**
   * Añade un producto al carrito.
   * Si el producto ya existe, incrementa su cantidad.
   * Si no existe, lo añade como un nuevo elemento con cantidad 1.
   * @param producto - El producto que se va a añadir.
   */
  agregarProducto(producto: Producto): void {
    // Buscamos si el producto ya está en el carrito.
    const itemExistente = this.items().find(
      (item) => item.producto.id === producto.id
    );

    if (itemExistente) {
      // Si existe, actualizamos la cantidad.
      // Usamos 'update' para modificar la señal basándonos en su valor actual.
      this.items.update((items) =>
        items.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      );
    } else {
      // Si no existe, lo añadimos al array.
      this.items.update((items) => [...items, { producto, cantidad: 1 }]);
    }
  }

  /**
   * Elimina un producto completamente del carrito.
   * @param idProducto - El ID del producto a eliminar.
   */
  eliminarProducto(idProducto: number): void {
    // Filtramos el array, quedándonos solo con los productos que NO coinciden con el ID.
    this.items.update((items) =>
      items.filter((item) => item.producto.id !== idProducto)
    );
  }

  /**
   * Vacía completamente el carrito de compras.
   */
  vaciarCarrito(): void {
    // Reemplazamos el estado actual con un array vacío.
    this.items.set([]);
  }
}
