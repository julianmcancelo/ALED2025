import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago-fallido',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card text-center">
            <div class="card-body">
              <div class="mb-4">
                <i class="bi bi-x-circle-fill text-danger" style="font-size: 4rem;"></i>
              </div>
              <h2 class="card-title text-danger">Pago No Procesado</h2>
              <p class="card-text">
                Hubo un problema al procesar tu pago. 
                No se realizó ningún cargo a tu cuenta.
              </p>
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Puedes intentar nuevamente o contactar con soporte si el problema persiste.
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" (click)="intentarNuevamente()">
                  <i class="bi bi-arrow-clockwise me-2"></i>
                  Intentar Nuevamente
                </button>
                <button class="btn btn-outline-secondary" (click)="volverAInicio()">
                  <i class="bi bi-house-fill me-2"></i>
                  Volver al Inicio
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
    .bi-x-circle-fill {
      animation: shake 0.5s ease-in-out;
    }
    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-5px);
      }
      75% {
        transform: translateX(5px);
      }
    }
  `]
})
export class PagoFallido {
  private router = inject(Router);

  volverAInicio(): void {
    this.router.navigate(['/']);
  }

  intentarNuevamente(): void {
    this.router.navigate(['/productos']);
  }
}