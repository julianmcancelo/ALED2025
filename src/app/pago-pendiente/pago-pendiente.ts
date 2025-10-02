import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago-pendiente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card text-center">
            <div class="card-body">
              <div class="mb-4">
                <i class="bi bi-clock-fill text-warning" style="font-size: 4rem;"></i>
              </div>
              <h2 class="card-title text-warning">Pago Pendiente</h2>
              <p class="card-text">
                Tu pago está siendo procesado. 
                Te notificaremos cuando se complete la transacción.
              </p>
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>¿Qué significa esto?</strong><br>
                Algunos métodos de pago requieren tiempo adicional para procesarse.
                Recibirás una confirmación por email una vez que se complete.
              </div>
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
    .bi-clock-fill {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }
  `]
})
export class PagoPendiente {
  private router = inject(Router);

  volverAInicio(): void {
    this.router.navigate(['/']);
  }

  verProductos(): void {
    this.router.navigate(['/productos']);
  }
}