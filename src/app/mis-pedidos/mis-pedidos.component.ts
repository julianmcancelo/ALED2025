import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { Router } from '@angular/router';

interface Pedido {
  id: string;
  paymentId: string;
  estado: 'completado' | 'pendiente' | 'rechazado' | 'reembolsado' | 'desconocido' | 'creado';
  total: number;
  moneda: string;
  metodoPago: string;
  items: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
  cliente: {
    email?: string;
    nombre?: string;
    apellido?: string;
    telefono?: string;
  };
  fechaCreacion?: any;
  fechaAprobacion?: any;
  fechaActualizacion?: any;
  motivoRechazo?: string;
  detallesPago?: any;
}

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <!-- Header simple -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="mb-1">
                <i class="fas fa-shopping-bag me-2 text-primary"></i>Mis Pedidos
              </h2>
              <p class="text-muted mb-0">Historial de tus compras</p>
            </div>
            <button class="btn btn-outline-primary" 
                    (click)="actualizarPedidos()" 
                    [disabled]="cargando()">
              <i class="fas fa-sync-alt me-2" [class.fa-spin]="cargando()"></i>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Estados de carga y error -->
      <div class="row">
        <div class="col-12">
          <!-- Loading -->
          <div *ngIf="cargando()" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Cargando tus pedidos...</p>
          </div>

          <!-- Error -->
          <div *ngIf="error()" class="alert alert-danger">
            <div class="d-flex align-items-center">
              <i class="fas fa-exclamation-triangle me-3"></i>
              <div class="flex-grow-1">
                <strong>Error al cargar pedidos</strong>
                <p class="mb-2">{{error()}}</p>
                <button class="btn btn-outline-danger btn-sm" (click)="actualizarPedidos()">
                  <i class="fas fa-redo me-1"></i>Reintentar
                </button>
              </div>
            </div>
          </div>

          <!-- Sin pedidos -->
          <div *ngIf="!cargando() && !error() && pedidos().length === 0" class="text-center py-5">
            <i class="fas fa-shopping-bag text-muted mb-3" style="font-size: 4rem; opacity: 0.5;"></i>
            <h4 class="text-muted mb-3">No tienes pedidos aún</h4>
            <p class="text-muted mb-4">¡Explora nuestra tienda y realiza tu primera compra!</p>
            <button class="btn btn-primary" (click)="irATienda()">
              <i class="fas fa-shopping-cart me-2"></i>Ir a la Tienda
            </button>
          </div>

          <!-- Lista de pedidos -->
          <div *ngIf="!cargando() && !error() && pedidos().length > 0">
            <div class="row">
              <div class="col-12" *ngFor="let pedido of pedidos(); trackBy: trackByPedidoId">
                <div class="card mb-4 shadow-sm">
                  <!-- Header del pedido -->
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <h6 class="mb-0">
                        <i [class]="obtenerIconoEstado(pedido.estado)" class="me-2"></i>
                        Pedido #{{pedido.id.replace('pedido_preliminar_', '').substring(0, 8)}}
                      </h6>
                      <small class="text-muted">
                        {{formatearFecha(pedido.fechaCreacion)}}
                      </small>
                    </div>
                    <span class="badge" [ngClass]="obtenerClaseEstado(pedido.estado)">
                      {{obtenerTextoEstado(pedido.estado)}}
                    </span>
                  </div>
                  
                  <!-- Body del pedido -->
                  <div class="card-body">
                    <div class="row">
                      <!-- Productos -->
                      <div class="col-md-8 mb-3">
                        <h6 class="mb-3"><i class="fas fa-box me-2"></i>Productos</h6>
                        <div *ngFor="let item of pedido.items; trackBy: trackByItemId" 
                             class="d-flex justify-content-between align-items-center mb-2 p-3 bg-light rounded">
                          <div>
                            <strong>{{item.nombre}}</strong>
                            <br>
                            <small class="text-muted">Cantidad: {{item.cantidad}}</small>
                          </div>
                          <div class="text-end">
                            <div class="fw-bold text-primary">\${{item.subtotal | number:'1.2-2'}}</div>
                            <small class="text-muted">\${{item.precio | number:'1.2-2'}} c/u</small>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Resumen -->
                      <div class="col-md-4">
                        <div class="card bg-light">
                          <div class="card-body">
                            <h6><i class="fas fa-receipt me-2"></i>Resumen</h6>
                            <div class="d-flex justify-content-between mb-2">
                              <span>Total:</span>
                              <strong class="text-primary">\${{pedido.total | number:'1.2-2'}}</strong>
                            </div>
                            <div class="d-flex justify-content-between mb-2">
                              <span>Método:</span>
                              <span>{{pedido.metodoPago || 'Pendiente'}}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                              <span>Moneda:</span>
                              <span>{{pedido.moneda || 'ARS'}}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Alertas según estado -->
                    <div *ngIf="pedido.estado === 'rechazado' && pedido.motivoRechazo" class="alert alert-danger mt-3">
                      <h6><i class="fas fa-exclamation-triangle me-2"></i>Motivo del rechazo:</h6>
                      <p class="mb-0">{{obtenerMotivoRechazo(pedido.motivoRechazo)}}</p>
                    </div>

                    <div *ngIf="pedido.estado === 'pendiente'" class="alert alert-warning mt-3">
                      <h6><i class="fas fa-clock me-2"></i>Pago en proceso</h6>
                      <p class="mb-0">Tu pago está siendo verificado. Te notificaremos por email cuando se confirme.</p>
                    </div>

                    <div *ngIf="pedido.estado === 'creado'" class="alert alert-info mt-3">
                      <h6><i class="fas fa-hourglass-half me-2"></i>Procesando pedido</h6>
                      <p class="mb-0">Tu pedido está siendo procesado. En breve recibirás la confirmación de pago.</p>
                    </div>

                    <div *ngIf="pedido.estado === 'reembolsado'" class="alert alert-info mt-3">
                      <h6><i class="fas fa-undo me-2"></i>Pedido reembolsado</h6>
                      <p class="mb-0">El reembolso fue procesado. Puede tardar hasta 10 días hábiles en reflejarse.</p>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="mt-3">
                      <button class="btn btn-outline-primary btn-sm me-2" (click)="verDetalles(pedido)">
                        <i class="fas fa-eye me-1"></i>Ver Detalles
                      </button>
                      
                      <button *ngIf="pedido.estado === 'rechazado'" 
                              class="btn btn-warning btn-sm me-2" 
                              (click)="reintentarCompra(pedido)">
                        <i class="fas fa-redo me-1"></i>Reintentar
                      </button>
                      
                      <button *ngIf="pedido.estado === 'completado'" 
                              class="btn btn-success btn-sm" disabled>
                        <i class="fas fa-check-circle me-1"></i>Completado
                      </button>
                      
                      <button *ngIf="pedido.estado === 'creado'" 
                              class="btn btn-info btn-sm" disabled>
                        <i class="fas fa-clock me-1"></i>Procesando...
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s ease;
    }
    
    .card:hover {
      transform: translateY(-2px);
    }
    
    .badge {
      font-size: 0.8rem;
    }
    
    .btn {
      transition: all 0.2s ease;
    }
  `]
})
export class MisPedidosComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  pedidos = signal<Pedido[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Configuración de Supabase
  private supabaseUrl = 'https://gyhzptzltqrxvgmwmkzm.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHpwdHpsdHFyeHZnbXdta3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODAyOTgsImV4cCI6MjA3NTY1NjI5OH0.rSrOQ4NWvwEU0Ec2HJTNYtpV7vp_0limf5Naf4ow7LM';

  ngOnInit(): void {
    this.cargarPedidos();
  }

  async cargarPedidos(): Promise<void> {
    const user = this.authService.currentUserSignal();
    
    if (!user || !user.email) {
      this.router.navigate(['/auth']);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      console.log('🔍 Cargando pedidos para usuario:', user.email);
      
      // Headers para Supabase
      const headers = new HttpHeaders({
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json'
      });

      // Consultar pedidos del usuario desde Supabase
      const url = `${this.supabaseUrl}/rest/v1/pedidos?clienteId=eq.${user.id}&order=created_at.desc`;
      
      const response = await this.http.get<any[]>(url, { headers }).toPromise();
      
      if (response) {
        // Mapear los datos de Supabase al formato esperado
        const pedidosMapeados = response.map(pedido => ({
          id: pedido.id,
          paymentId: pedido.payment_id || '',
          estado: pedido.estado || 'desconocido',
          total: pedido.total || 0,
          moneda: pedido.moneda || 'ARS',
          metodoPago: pedido.metodo_pago || 'Pendiente',
          items: pedido.items || [],
          cliente: {
            email: user.email || undefined,
            nombre: user.nombre,
            apellido: user.apellido,
            telefono: user.telefono
          },
          fechaCreacion: pedido.created_at,
          fechaAprobacion: pedido.fecha_aprobacion,
          fechaActualizacion: pedido.updated_at,
          motivoRechazo: pedido.motivo_rechazo,
          detallesPago: pedido.detalles_pago
        }));
        
        console.log(`✅ ${pedidosMapeados.length} pedidos cargados para ${user.email}`);
        this.pedidos.set(pedidosMapeados);
      } else {
        this.pedidos.set([]);
      }
      
      this.cargando.set(false);
    } catch (error: any) {
      console.error('❌ Error cargando pedidos:', error);
      this.error.set('No se pudieron cargar los pedidos. Intenta nuevamente.');
      this.cargando.set(false);
    }
  }

  actualizarPedidos(): void {
    this.cargarPedidos();
  }

  obtenerClaseEstado(estado: string): string {
    const clases = {
      'completado': 'bg-success',
      'pendiente': 'bg-warning text-dark',
      'rechazado': 'bg-danger',
      'reembolsado': 'bg-info',
      'desconocido': 'bg-secondary',
      'creado': 'bg-primary'
    };
    return clases[estado as keyof typeof clases] || 'bg-secondary';
  }

  obtenerIconoEstado(estado: string): string {
    const iconos = {
      'completado': 'fas fa-check-circle',
      'pendiente': 'fas fa-clock',
      'rechazado': 'fas fa-times-circle',
      'reembolsado': 'fas fa-undo',
      'desconocido': 'fas fa-question-circle',
      'creado': 'fas fa-hourglass-half'
    };
    return iconos[estado as keyof typeof iconos] || 'fas fa-question-circle';
  }

  obtenerTextoEstado(estado: string): string {
    const textos = {
      'completado': 'Completado',
      'pendiente': 'Pendiente',
      'rechazado': 'Rechazado',
      'reembolsado': 'Reembolsado',
      'desconocido': 'Desconocido',
      'creado': 'Procesando'
    };
    return textos[estado as keyof typeof textos] || 'Desconocido';
  }

  obtenerMotivoRechazo(motivo: string): string {
    const motivos: {[key: string]: string} = {
      'cc_rejected_insufficient_amount': 'Fondos insuficientes en la tarjeta',
      'cc_rejected_bad_filled_card_number': 'Número de tarjeta incorrecto',
      'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta',
      'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto',
      'cc_rejected_bad_filled_other': 'Datos de tarjeta incorrectos',
      'cc_rejected_high_risk': 'Pago rechazado por seguridad',
      'cc_rejected_max_attempts': 'Máximo de intentos excedido',
      'cc_rejected_duplicated_payment': 'Pago duplicado',
      'cc_rejected_card_disabled': 'Tarjeta deshabilitada',
      'cc_rejected_call_for_authorize': 'Contactar al banco para autorizar'
    };
    
    return motivos[motivo] || `Motivo: ${motivo}`;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'Fecha no disponible';
    
    let date: Date;
    if (fecha.seconds) {
      // Timestamp de Firestore
      date = new Date(fecha.seconds * 1000);
    } else {
      date = new Date(fecha);
    }
    
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  reintentarCompra(pedido: Pedido): void {
    // Agregar items al carrito y redirigir
    const carrito = pedido.items.map(item => ({
      producto: {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio
      },
      cantidad: item.cantidad
    }));
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    this.router.navigate(['/carrito']);
  }

  verDetalles(pedido: Pedido): void {
    // Mostrar modal o navegar a página de detalles
    console.log('Ver detalles del pedido:', pedido);
  }

  irATienda(): void {
    this.router.navigate(['/tienda']);
  }

  // Métodos para trackBy (optimización de rendimiento)
  trackByPedidoId(index: number, pedido: Pedido): string {
    return pedido.id;
  }

  trackByItemId(index: number, item: any): string {
    return item.id;
  }

  // Método para obtener clases del header según estado
  obtenerClaseHeaderEstado(estado: string): string {
    const clases = {
      'completado': 'bg-success text-white',
      'pendiente': 'bg-warning text-dark',
      'rechazado': 'bg-danger text-white',
      'reembolsado': 'bg-info text-white',
      'desconocido': 'bg-secondary text-white',
      'creado': 'bg-primary text-white'
    };
    return clases[estado as keyof typeof clases] || 'bg-secondary text-white';
  }
}
