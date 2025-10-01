import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http'; // Importar HttpClient
import { CarritoService } from '../services/carrito';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.html',
})
export class Carrito {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected carritoService = inject(CarritoService);
  protected activeOffcanvas = inject(NgbActiveOffcanvas);
  private http = inject(HttpClient); // Inyectar HttpClient

  // --- SEÑALES DE ESTADO ---
  cargandoMP = signal(false); // Para mostrar un spinner en el botón de pago

  cerrar(): void {
    this.activeOffcanvas.dismiss('Cross click');
  }

  manejarEliminar(idProducto: string | undefined): void {
    // Nos aseguramos de que el ID exista antes de intentar eliminar.
    if (idProducto) {
      this.carritoService.eliminarProducto(idProducto);
    }
  }

  manejarVaciar(): void {
    this.carritoService.vaciarCarrito();
  }

  /**
   * Inicia el proceso de pago con Mercado Pago.
   */
  async pagarConMercadoPago(): Promise<void> {
    const items = this.carritoService.items();
    if (items.length === 0) return;

    this.cargandoMP.set(true);

    // URL de tu Firebase Function (asegúrate de que coincida con tu proyecto)
    const functionUrl = 'https://us-central1-aled3-6b4ee.cloudfunctions.net/createPreference';

    this.http.post<{ id: string }>(functionUrl, { items }).subscribe({
      next: (res) => {
        // Una vez que tenemos el ID de la preferencia, redirigimos al checkout
        window.location.href = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?preference_id=${res.id}`;
      },
      error: (err) => {
        console.error('Error al crear la preferencia de Mercado Pago:', err);
        alert('Hubo un error al intentar procesar el pago. Por favor, intenta de nuevo.');
        this.cargandoMP.set(false);
      },
    });
  }
}
