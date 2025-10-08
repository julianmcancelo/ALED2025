import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CarritoService } from '../servicios/carrito';

@Component({
  selector: 'app-pago-exitoso',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card text-center">
            <div class="card-body">
              <div class="mb-4">
                <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
              </div>
              <h2 class="card-title text-success">¡Pago Exitoso!</h2>
              <p class="card-text">
                Tu pago ha sido procesado correctamente. 
                Recibirás un email de confirmación en breve.
              </p>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" (click)="volverAInicio()">
                  <i class="bi bi-house-fill me-2"></i>
                  Volver al Inicio
                </button>
                <button class="btn btn-outline-secondary" (click)="verProductos()">
                  <i class="bi bi-shop me-2"></i>
                  Seguir Comprando
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: none;
    }
    .bi-check-circle-fill {
      animation: bounce 1s ease-in-out;
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
  `]
})
export class PagoExitoso {
  private router = inject(Router);
  private carritoService = inject(CarritoService);

  constructor() {
    // Limpiar el carrito después de un pago exitoso
    this.carritoService.vaciarCarrito();
  }

  volverAInicio(): void {
    this.router.navigate(['/']);
  }

  verProductos(): void {
    this.router.navigate(['/productos']);
  }
}