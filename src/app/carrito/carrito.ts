import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// Importamos nuestro servicio y las interfaces
import { CarritoService } from '../services/carrito';

/**
 * @component Carrito
 * Componente encargado de mostrar el contenido del carrito de compras.
 * Ahora adaptado para funcionar dentro de un modal de ng-bootstrap.
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
   * Inyectamos NgbActiveModal, que nos da una referencia al modal activo
   * y nos permite cerrarlo.
   */
  protected activeModal = inject(NgbActiveModal);

  // --- MÉTODOS DEL TEMPLATE ---

  /**
   * Cierra el modal actual.
   */
  cerrar(): void {
    this.activeModal.dismiss('Cross click');
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
    this.activeModal.close('Checkout'); // Cierra el modal después del checkout
  }
}
