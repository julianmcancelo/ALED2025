import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GestionPedidosService } from '../../servicios/gestion-pedidos.service';
import Swal from 'sweetalert2';

// Interfaces para los pedidos de Mercado Pago
interface PedidoMercadoPago {
  id: string;
  paymentId: string;
  estado: 'completado' | 'pendiente' | 'rechazado' | 'reembolsado' | 'desconocido';
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
  fechaCreacion: any;
  fechaAprobacion?: any;
  fechaActualizacion?: any;
  motivoRechazo?: string;
  detallesPago: any;
}

/**
 * ============================================================================
 * COMPONENTE: GESTIÓN DE PEDIDOS DE MERCADO PAGO
 * ============================================================================
 * 
 * Este componente permite al administrador gestionar todos los pedidos:
 * - Ver historial completo de compras
 * - Filtrar por estado (completado, pendiente, rechazado, etc.)
 * - Ver detalles de cada transacción
 * - Monitorear el estado de los pagos en tiempo real
 * - Gestionar reembolsos y problemas
 */
@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header con título y estadísticas -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2><i class="fas fa-shopping-cart me-2"></i>Historial de Compras - Mercado Pago</h2>
            <button class="btn btn-primary" (click)="cargarPedidos()">
              <i class="fas fa-sync-alt me-2"></i>Actualizar
            </button>
          </div>
          
          <!-- Tarjetas de estadísticas -->
          <div class="row">
            <div class="col-md-2">
              <div class="card bg-primary text-white">
                <div class="card-body text-center">
                  <h5>{{estadisticas().total}}</h5>
                  <small>Total Pedidos</small>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card bg-success text-white">
                <div class="card-body text-center">
                  <h5>{{estadisticas().completados}}</h5>
                  <small>Completados</small>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card bg-warning text-dark">
                <div class="card-body text-center">
                  <h5>{{estadisticas().pendientes}}</h5>
                  <small>Pendientes</small>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card bg-danger text-white">
                <div class="card-body text-center">
                  <h5>{{estadisticas().rechazados}}</h5>
                  <small>Rechazados</small>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card bg-info text-white">
                <div class="card-body text-center">
                  <h5>{{estadisticas().reembolsados}}</h5>
                  <small>Reembolsados</small>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="card bg-secondary text-white">
                <div class="card-body text-center">
                  <h5>{{estadisticas().desconocidos}}</h5>
                  <small>Desconocidos</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text"><i class="fas fa-search"></i></span>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Buscar por ID, email, nombre..."
              [value]="busquedaTexto()"
              (input)="actualizarBusqueda($event)">
          </div>
        </div>
        <div class="col-md-4">
          <select class="form-select" [value]="filtroEstado()" (change)="cambiarFiltroEstado($event)">
            <option value="todos">📋 Todos los Estados</option>
            <option value="completado">✅ Completados</option>
            <option value="pendiente">⏳ Pendientes</option>
            <option value="rechazado">❌ Rechazados</option>
            <option value="reembolsado">💰 Reembolsados</option>
            <option value="desconocido">❓ Desconocidos</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary w-100" (click)="limpiarFiltros()">
            <i class="fas fa-eraser me-2"></i>Limpiar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="cargando()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando historial de compras...</p>
      </div>

      <!-- Tabla de pedidos -->
      <div *ngIf="!cargando()" class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="fas fa-list me-2"></i>
            Historial Completo ({{pedidosFiltrados().length}} pedidos)
          </h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-dark">
                <tr>
                  <th>ID Pedido</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Método Pago</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pedido of pedidosFiltrados()">
                  <td>
                    <strong>{{pedido.id.replace('pedido_', '')}}</strong>
                    <br>
                    <small class="text-muted">MP: {{pedido.paymentId}}</small>
                  </td>
                  <td>
                    <div>
                      <strong>{{pedido.cliente.nombre}} {{pedido.cliente.apellido}}</strong>
                      <br>
                      <small class="text-muted">{{pedido.cliente.email}}</small>
                    </div>
                  </td>
                  <td>
                    <span [class]="'badge ' + obtenerClaseEstado(pedido.estado)">
                      <i [class]="obtenerIconoEstado(pedido.estado) + ' me-1'"></i>
                      {{obtenerTextoEstado(pedido.estado)}}
                    </span>
                    <div *ngIf="pedido.motivoRechazo" class="mt-1">
                      <small class="text-danger">
                        <i class="fas fa-exclamation-triangle me-1"></i>
                        {{obtenerMotivoRechazo(pedido.motivoRechazo)}}
                      </small>
                    </div>
                  </td>
                  <td>
                    <strong class="text-success">\${{pedido.total | number:'1.2-2'}}</strong>
                    <br>
                    <small class="text-muted">{{pedido.moneda}}</small>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark">{{pedido.metodoPago}}</span>
                  </td>
                  <td>
                    <div>{{formatearFecha(pedido.fechaCreacion)}}</div>
                    <small *ngIf="pedido.fechaAprobacion" class="text-success">
                      ✅ {{formatearFecha(pedido.fechaAprobacion)}}
                    </small>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary me-1" 
                            (click)="verDetallesPedido(pedido)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button *ngIf="pedido.estado === 'completado'" 
                            class="btn btn-sm btn-outline-warning"
                            (click)="procesarReembolso(pedido)">
                      <i class="fas fa-undo"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Sin resultados -->
          <div *ngIf="pedidosFiltrados().length === 0" class="text-center py-5">
            <i class="fas fa-search text-muted" style="font-size: 3rem;"></i>
            <h5 class="mt-3 text-muted">No se encontraron pedidos</h5>
            <p class="text-muted">Intenta cambiar los filtros de búsqueda</p>
          </div>
        </div>
      </div>

      <!-- Modal de detalles -->
      <div *ngIf="mostrarDetalles() && pedidoSeleccionado" class="modal d-block" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-receipt me-2"></i>
                Detalles del Pedido #{{pedidoSeleccionado.id.replace('pedido_', '')}}
              </h5>
              <button type="button" class="btn-close" (click)="cerrarDetalles()"></button>
            </div>
            <div class="modal-body">
              <!-- Información del cliente -->
              <div class="row mb-4">
                <div class="col-md-6">
                  <h6><i class="fas fa-user me-2"></i>Información del Cliente</h6>
                  <p><strong>Nombre:</strong> {{pedidoSeleccionado.cliente.nombre}} {{pedidoSeleccionado.cliente.apellido}}</p>
                  <p><strong>Email:</strong> {{pedidoSeleccionado.cliente.email}}</p>
                  <p *ngIf="pedidoSeleccionado.cliente.telefono"><strong>Teléfono:</strong> {{pedidoSeleccionado.cliente.telefono}}</p>
                </div>
                <div class="col-md-6">
                  <h6><i class="fas fa-credit-card me-2"></i>Información del Pago</h6>
                  <p><strong>ID Mercado Pago:</strong> {{pedidoSeleccionado.paymentId}}</p>
                  <p><strong>Estado:</strong> 
                    <span [class]="'badge ' + obtenerClaseEstado(pedidoSeleccionado.estado)">
                      {{obtenerTextoEstado(pedidoSeleccionado.estado)}}
                    </span>
                  </p>
                  <p><strong>Método:</strong> {{pedidoSeleccionado.metodoPago}}</p>
                  <p><strong>Total:</strong> <span class="text-success">\${{pedidoSeleccionado.total | number:'1.2-2'}}</span></p>
                </div>
              </div>

              <!-- Productos -->
              <h6><i class="fas fa-shopping-bag me-2"></i>Productos Comprados</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of pedidoSeleccionado.items">
                      <td>{{item.nombre}}</td>
                      <td>{{item.cantidad}}</td>
                      <td>\${{item.precio | number:'1.2-2'}}</td>
                      <td>\${{item.subtotal | number:'1.2-2'}}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Detalles técnicos -->
              <h6><i class="fas fa-cog me-2"></i>Detalles Técnicos</h6>
              <div class="row">
                <div class="col-md-6">
                  <p><strong>Fecha Creación:</strong> {{formatearFecha(pedidoSeleccionado.fechaCreacion)}}</p>
                  <p *ngIf="pedidoSeleccionado.fechaAprobacion"><strong>Fecha Aprobación:</strong> {{formatearFecha(pedidoSeleccionado.fechaAprobacion)}}</p>
                </div>
                <div class="col-md-6">
                  <p><strong>Última Actualización:</strong> {{formatearFecha(pedidoSeleccionado.fechaActualizacion)}}</p>
                  <p *ngIf="pedidoSeleccionado.motivoRechazo"><strong>Motivo Rechazo:</strong> {{obtenerMotivoRechazo(pedidoSeleccionado.motivoRechazo)}}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarDetalles()">Cerrar</button>
              <button *ngIf="pedidoSeleccionado.estado === 'completado'" 
                      type="button" 
                      class="btn btn-warning"
                      (click)="procesarReembolso(pedidoSeleccionado)">
                <i class="fas fa-undo me-2"></i>Procesar Reembolso
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal {
      background-color: rgba(0,0,0,0.5);
    }
    
    .card {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .table th {
      border-top: none;
    }
    
    .badge {
      font-size: 0.8rem;
    }
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
    }
  `]
})
export class GestionPedidosComponent implements OnInit {
  private gestionPedidosService = inject(GestionPedidosService);

  // --- SIGNALS PARA ESTADO REACTIVO ---
  pedidos = signal<PedidoMercadoPago[]>([]);
  cargando = signal<boolean>(true);
  filtroEstado = signal<string>('todos');
  busquedaTexto = signal<string>('');
  mostrarDetalles = signal<boolean>(false);
  pedidoSeleccionado: PedidoMercadoPago | null = null;

  // --- COMPUTED SIGNALS ---
  pedidosFiltrados = computed(() => {
    let resultado = this.pedidos();
    
    // Filtrar por estado
    if (this.filtroEstado() !== 'todos') {
      resultado = resultado.filter(pedido => pedido.estado === this.filtroEstado());
    }
    
    // Filtrar por texto de búsqueda
    const busqueda = this.busquedaTexto().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(pedido => 
        pedido.id.toLowerCase().includes(busqueda) ||
        pedido.paymentId.toLowerCase().includes(busqueda) ||
        pedido.cliente.email?.toLowerCase().includes(busqueda) ||
        pedido.cliente.nombre?.toLowerCase().includes(busqueda) ||
        pedido.cliente.apellido?.toLowerCase().includes(busqueda)
      );
    }
    
    return resultado.sort((a, b) => {
      const fechaA = a.fechaCreacion?.seconds || 0;
      const fechaB = b.fechaCreacion?.seconds || 0;
      return fechaB - fechaA; // Más recientes primero
    });
  });

  // Estadísticas computadas
  estadisticas = computed(() => {
    const todos = this.pedidos();
    return {
      total: todos.length,
      completados: todos.filter(p => p.estado === 'completado').length,
      pendientes: todos.filter(p => p.estado === 'pendiente').length,
      rechazados: todos.filter(p => p.estado === 'rechazado').length,
      reembolsados: todos.filter(p => p.estado === 'reembolsado').length,
      desconocidos: todos.filter(p => p.estado === 'desconocido').length
    };
  });

  ngOnInit(): void {
    this.cargarPedidos();
  }

  /**
   * ============================================================================
   * MÉTODOS PARA CARGAR DATOS
   * ============================================================================
   */

  /**
   * Carga todos los pedidos desde Supabase
   */
  cargarPedidos(): void {
    console.log('📋 Cargando pedidos de Mercado Pago...');
    this.cargando.set(true);
    
    this.gestionPedidosService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos: any[]) => {
        console.log(`✅ ${pedidos.length} pedidos cargados`);
        this.pedidos.set(pedidos as PedidoMercadoPago[]);
        this.cargando.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar pedidos:', error);
        this.cargando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los pedidos. Intenta recargar la página.',
        });
      }
    });
  }

  /**
   * ============================================================================
   * MÉTODOS PARA FILTROS Y BÚSQUEDA
   * ============================================================================
   */

  /**
   * Cambia el filtro de estado
   */
  cambiarFiltroEstado(evento: Event): void {
    const select = evento.target as HTMLSelectElement;
    console.log(`🔍 Cambiando filtro a: ${select.value}`);
    this.filtroEstado.set(select.value);
  }

  /**
   * Actualiza el texto de búsqueda
   */
  actualizarBusqueda(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.busquedaTexto.set(input.value);
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroEstado.set('todos');
    this.busquedaTexto.set('');
  }

  /**
   * ============================================================================
   * MÉTODOS PARA DETALLES DE PEDIDOS
   * ============================================================================
   */

  /**
   * Muestra los detalles completos de un pedido
   */
  verDetallesPedido(pedido: PedidoMercadoPago): void {
    this.pedidoSeleccionado = pedido;
    this.mostrarDetalles.set(true);
  }

  /**
   * Cierra el modal de detalles
   */
  cerrarDetalles(): void {
    this.pedidoSeleccionado = null;
    this.mostrarDetalles.set(false);
  }

  /**
   * Procesa un reembolso
   */
  async procesarReembolso(pedido: PedidoMercadoPago): Promise<void> {
    const { value: confirmacion } = await Swal.fire({
      title: '¿Procesar Reembolso?',
      text: `¿Estás seguro de procesar el reembolso para el pedido ${pedido.id.replace('pedido_', '')}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, procesar reembolso',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f39c12',
      cancelButtonColor: '#d33'
    });

    if (confirmacion) {
      Swal.fire({
        icon: 'info',
        title: 'Función en desarrollo',
        text: 'La funcionalidad de reembolso automático estará disponible próximamente. Por favor, procesa el reembolso manualmente desde el panel de Mercado Pago.',
      });
    }
  }

  /**
   * ============================================================================
   * MÉTODOS AUXILIARES
   * ============================================================================
   */

  /**
   * Obtiene el texto del estado en español
   */
  obtenerTextoEstado(estado: string): string {
    const textos: {[key: string]: string} = {
      'completado': 'Completado',
      'pendiente': 'Pendiente',
      'rechazado': 'Rechazado',
      'reembolsado': 'Reembolsado',
      'desconocido': 'Desconocido'
    };
    return textos[estado] || 'Desconocido';
  }

  /**
   * Obtiene las clases CSS para el color del estado
   */
  obtenerClaseEstado(estado: string): string {
    const clases: {[key: string]: string} = {
      'completado': 'bg-success',
      'pendiente': 'bg-warning text-dark',
      'rechazado': 'bg-danger',
      'reembolsado': 'bg-info',
      'desconocido': 'bg-secondary'
    };
    return clases[estado] || 'bg-secondary';
  }

  /**
   * Obtiene el icono del estado
   */
  obtenerIconoEstado(estado: string): string {
    const iconos: {[key: string]: string} = {
      'completado': 'fas fa-check-circle',
      'pendiente': 'fas fa-clock',
      'rechazado': 'fas fa-times-circle',
      'reembolsado': 'fas fa-undo',
      'desconocido': 'fas fa-question-circle'
    };
    return iconos[estado] || 'fas fa-question-circle';
  }

  /**
   * Obtiene el motivo del rechazo en español
   */
  obtenerMotivoRechazo(motivo: string): string {
    const motivos: {[key: string]: string} = {
      'cc_rejected_insufficient_amount': 'Fondos insuficientes',
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
    
    return motivos[motivo] || motivo;
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatearFecha(fecha: any): string {
    if (!fecha) return 'No disponible';
    
    let fechaObj: Date;
    if (fecha.seconds) {
      // Timestamp de Firestore
      fechaObj = new Date(fecha.seconds * 1000);
    } else if (fecha.toDate) {
      fechaObj = fecha.toDate();
    } else {
      fechaObj = new Date(fecha);
    }
    
    return fechaObj.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
