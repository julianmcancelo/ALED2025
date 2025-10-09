import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pago-pendiente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card border-warning">
            <div class="card-header bg-warning text-dark text-center">
              <h3><i class="fas fa-clock me-2"></i>Pago Pendiente</h3>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="fas fa-hourglass-half text-warning" style="font-size: 4rem;"></i>
              </div>
              
              <h4 class="text-warning mb-3">Tu pago está siendo procesado</h4>
              
              <p class="lead mb-4">
                Estamos verificando tu pago. Te notificaremos por email cuando se confirme.
              </p>
              
              <div class="alert alert-info">
                <h6><i class="fas fa-info-circle me-2"></i>¿Qué significa esto?</h6>
                <ul class="list-unstyled mb-0 text-start">
                  <li>⏳ Tu pago está en proceso de verificación</li>
                  <li>🔍 Puede tomar hasta 48 horas hábiles</li>
                  <li>📧 Te notificaremos por email del resultado</li>
                  <li>💰 No se realizará cargo hasta confirmar</li>
                </ul>
              </div>
              
              <div class="alert alert-warning">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Causas comunes:</h6>
                <ul class="list-unstyled mb-0 text-start">
                  <li>• Pago con transferencia bancaria</li>
                  <li>• Verificación adicional del banco</li>
                  <li>• Pago en efectivo (Rapipago, Pago Fácil)</li>
                  <li>• Límites de seguridad de la tarjeta</li>
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
              
              <div class="mt-4">
                <small class="text-muted">
                  <i class="fas fa-envelope me-1"></i>
                  Te mantendremos informado por email sobre el estado de tu pago
                </small>
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
    
    .text-start {
      text-align: left !important;
    }
    
    .fas.fa-hourglass-half {
      animation: spin 3s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class PagoPendienteComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Limpiar carrito ya que el pago está en proceso
    localStorage.removeItem('carrito');
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  volverATienda(): void {
    this.router.navigate(['/tienda']);
  }
}
