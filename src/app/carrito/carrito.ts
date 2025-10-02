import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CarritoService } from '../services/carrito';
import { AuthService } from '../auth/auth';
import { InicioDeSesion } from '../auth/inicio-sesion/inicio-sesion';
import { Registro } from '../auth/registro/registro'; // Importar componente de registro
import { AuthRequeridoComponent } from '../auth/auth-requerido/auth-requerido'; // Importar nuevo modal

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './carrito.html',
})
export class Carrito {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected carritoService = inject(CarritoService);
  protected activeOffcanvas = inject(NgbActiveOffcanvas);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  cargandoMP = signal(false);

  /**
   * Inicia el proceso de pago, verificando primero la autenticación del usuario.
   */
  pagarConMercadoPago(): void {
    if (this.authService.currentUserSignal()) {
      // Si el usuario ya ha iniciado sesión, procedemos directamente al pago.
      this._proceedToMercadoPago();
    } else {
      // Si es un invitado, cerramos el carrito y abrimos el modal de notificación.
      this.activeOffcanvas.dismiss('Authentication required');
      this.openAuthRequiredModal();
    }
  }

  /**
   * Abre el modal que pregunta al usuario si quiere iniciar sesión o registrarse.
   */
  private openAuthRequiredModal(): void {
    const dialogRef = this.dialog.open(AuthRequeridoComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'login') {
        this.openLoginModal();
      } else if (result === 'register') {
        this.openRegisterModal();
      }
    });
  }

  /**
   * Abre el modal de inicio de sesión y gestiona la continuación del pago.
   */
  private openLoginModal(): void {
    const dialogRef = this.dialog.open(InicioDeSesion);
    this.handleAuthModalClose(dialogRef);
  }

  /**
   * Abre el modal de registro y gestiona la continuación del pago.
   */
  private openRegisterModal(): void {
    const dialogRef = this.dialog.open(Registro);
    this.handleAuthModalClose(dialogRef);
  }

  /**
   * Se suscribe al cierre de un modal de autenticación (login/registro).
   * Si el usuario se autenticó, reanuda el pago.
   * @param dialogRef - La referencia al diálogo que se abrió.
   */
  private handleAuthModalClose(dialogRef: any): void {
    dialogRef.afterClosed().subscribe(() => {
      if (this.authService.currentUserSignal()) {
        this._proceedToMercadoPago();
      }
    });
  }

  /**
   * Contiene la lógica para contactar con el backend y redirigir a Mercado Pago.
   * @private
   */
  private _proceedToMercadoPago(): void {
    const items = this.carritoService.items();
    if (items.length === 0) return;

    this.cargandoMP.set(true);
    this.activeOffcanvas.dismiss('Processing payment');

    const functionUrl = 'http://127.0.0.1:5001/aled3-6b4ee/us-central1/createPreference';

    this.http.post<{ id: string }>(functionUrl, { items }).subscribe({
      next: (res) => {
        window.location.href = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?preference_id=${res.id}`;
      },
      error: (err) => {
        console.error('Error al crear la preferencia de Mercado Pago:', err);
        alert('Hubo un error al intentar procesar el pago. Por favor, intenta de nuevo.');
        this.cargandoMP.set(false);
      },
    });
  }

  // --- Otros métodos del componente ---
  cerrar(): void {
    this.activeOffcanvas.dismiss('Cross click');
  }

  manejarEliminar(idProducto: string | undefined): void {
    if (idProducto) {
      this.carritoService.eliminarProducto(idProducto);
    }
  }

  manejarVaciar(): void {
    this.carritoService.vaciarCarrito();
  }
}
