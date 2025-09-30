import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';

// Importamos nuestro servicio y las interfaces
import { CarritoService } from '../services/carrito';

/**
 * @component Carrito
 * Componente encargado de mostrar el contenido del carrito de compras.
 * Adaptado para funcionar dentro de un panel lateral (off-canvas) de ng-bootstrap.
 */
@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.html',
})
export class Carrito {
  // --- INYECCIÓN DE DEPENDENCIAS ---

  /**
   * Inyectamos una instancia de CarritoService para acceder a los datos.
   */
  protected carritoService = inject(CarritoService);

  /**
   * Inyectamos NgbActiveOffcanvas, que nos da una referencia al panel activo
   * y nos permite cerrarlo.
   */
  protected activeOffcanvas = inject(NgbActiveOffcanvas);

  // --- MÉTODOS DEL TEMPLATE ---

  /**
   * Cierra el panel lateral actual.
   */
  cerrar(): void {
    this.activeOffcanvas.dismiss('Cross click');
  }

  /**
   * Maneja la eliminación de un producto del carrito.
   */
  manejarEliminar(idProducto: number): void {
    this.carritoService.eliminarProducto(idProducto);
  }

  /**
   * Maneja el vaciado completo del carrito.
   */
  manejarVaciar(): void {
    this.carritoService.vaciarCarrito();
  }

  /**
   * Simula el proceso de finalización de la compra.
   */
  manejarCheckout(): void {
    const items = this.carritoService.items();
    const total = this.carritoService.totalPrecio();

    alert(
      `¡Gracias por tu compra! Has comprado ${items.length} productos por un total de $${total}.`,
    );
    console.log('Checkout realizado:', { items, total });

    this.carritoService.vaciarCarrito();
    this.activeOffcanvas.close('Checkout'); // Cierra el panel después del checkout
  }
}
