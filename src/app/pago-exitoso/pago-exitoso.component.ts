import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pago-exitoso',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card border-success">
            <div class="card-header bg-success text-white text-center">
              <h3><i class="fas fa-check-circle me-2"></i>¡Pago Exitoso!</h3>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="fas fa-check-circle text-success" style="font-size: 4rem;"></i>
              </div>
              
              <h4 class="text-success mb-3">¡Tu compra se procesó correctamente!</h4>
              
              <p class="lead mb-4">
                Gracias por tu compra. Recibirás un email de confirmación con los detalles de tu pedido.
              </p>
              
              <div class="alert alert-info">
                <h6><i class="fas fa-info-circle me-2"></i>¿Qué sigue?</h6>
                <ul class="list-unstyled mb-0">
                  <li>✅ Tu pago fue procesado exitosamente</li>
                  <li>📧 Recibirás un email de confirmación</li>
                  <li>📦 Prepararemos tu pedido para envío</li>
                  <li>🚚 Te notificaremos cuando esté en camino</li>
                </ul>
              </div>
              
              <div class="mt-4">
                <button class="btn btn-primary me-3" (click)="verMisPedidos()">
                  <i class="fas fa-list me-2"></i>Ver Mis Pedidos
                </button>
                <button class="btn btn-outline-secondary" (click)="volverATienda()">
                  <i class="fas fa-shopping-bag me-2"></i>Seguir Comprando
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
    }
    
    .fas.fa-check-circle {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `]
})
export class PagoExitosoComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Limpiar carrito después de compra exitosa
    localStorage.removeItem('carrito');
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  volverATienda(): void {
    this.router.navigate(['/tienda']);
  }
}
