import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pago-fallido',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card border-danger">
            <div class="card-header bg-danger text-white text-center">
              <h3><i class="fas fa-times-circle me-2"></i>Pago Rechazado</h3>
            </div>
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="fas fa-times-circle text-danger" style="font-size: 4rem;"></i>
              </div>
              
              <h4 class="text-danger mb-3">No pudimos procesar tu pago</h4>
              
              <p class="lead mb-4">
                Tu pago fue rechazado. No te preocupes, no se realizó ningún cargo a tu tarjeta.
              </p>
              
              <div class="alert alert-warning">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Posibles causas:</h6>
                <ul class="list-unstyled mb-0 text-start">
                  <li>• Fondos insuficientes en la tarjeta</li>
                  <li>• Datos de la tarjeta incorrectos</li>
                  <li>• Límite de compra excedido</li>
                  <li>• Problemas temporales del banco</li>
                </ul>
              </div>
              
              <div class="alert alert-info">
                <h6><i class="fas fa-lightbulb me-2"></i>¿Qué puedes hacer?</h6>
                <ul class="list-unstyled mb-0 text-start">
                  <li>✅ Verificar los datos de tu tarjeta</li>
                  <li>💳 Intentar con otra tarjeta</li>
                  <li>📞 Contactar a tu banco</li>
                  <li>🔄 Intentar nuevamente más tarde</li>
                </ul>
              </div>
              
              <div class="mt-4">
                <button class="btn btn-primary me-3" (click)="intentarNuevamente()">
                  <i class="fas fa-redo me-2"></i>Intentar Nuevamente
                </button>
                <button class="btn btn-outline-secondary me-3" (click)="verMisPedidos()">
                  <i class="fas fa-list me-2"></i>Ver Mis Pedidos
                </button>
                <button class="btn btn-outline-dark" (click)="volverATienda()">
                  <i class="fas fa-shopping-bag me-2"></i>Volver a la Tienda
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
    
    .text-start {
      text-align: left !important;
    }
  `]
})
export class PagoFallidoComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // El carrito se mantiene para que el usuario pueda intentar nuevamente
  }

  intentarNuevamente(): void {
    this.router.navigate(['/carrito']);
  }

  verMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  volverATienda(): void {
    this.router.navigate(['/tienda']);
  }
}
