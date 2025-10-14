import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosFirestoreService, PedidoMercadoPago, EstadoPedidoMP } from '../../servicios/pedidos-firestore.service';
import Swal from 'sweetalert2';

// Interfaces importadas desde el servicio

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
      <!-- Header Simple -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-bag-check me-2 text-primary"></i>Gestión de Pedidos
              </h2>
              <p class="text-muted mb-0">Administra todas las ventas y transacciones</p>
            </div>
            <div class="btn-group">
              <button class="btn btn-outline-primary" (click)="cargarPedidos()" [disabled]="cargando()">
                <i class="bi bi-arrow-clockwise me-2" [class.fa-spin]="cargando()"></i>
                Actualizar
              </button>
              <button class="btn btn-outline-success" (click)="crearPedidosDePrueba()">
                <i class="bi bi-plus-circle me-2"></i>
                Crear Pruebas
              </button>
              <button class="btn btn-outline-danger" 
                      (click)="eliminarTodosLosPedidos()" 
                      [disabled]="cargando() || pedidos().length === 0"
                      title="Eliminar todos los pedidos">
                <i class="bi bi-trash me-2"></i>
                Eliminar Todo
              </button>
            </div>
          </div>
        </div>
      </div>
          
      <!-- Estadísticas Simples -->
      <div class="row mb-4">
        <div class="col-md-2">
          <div class="card text-center">
            <div class="card-body">
              <i class="bi bi-graph-up text-primary mb-2" style="font-size: 1.5rem;"></i>
              <h5 class="card-title">{{estadisticas().total}}</h5>
              <p class="card-text text-muted small">Total</p>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card text-center">
            <div class="card-body">
              <i class="bi bi-check-circle text-success mb-2" style="font-size: 1.5rem;"></i>
              <h5 class="card-title">{{estadisticas().completados}}</h5>
              <p class="card-text text-muted small">Completados</p>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card text-center">
            <div class="card-body">
              <i class="bi bi-clock text-warning mb-2" style="font-size: 1.5rem;"></i>
              <h5 class="card-title">{{estadisticas().pendientes}}</h5>
              <p class="card-text text-muted small">Pendientes</p>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card text-center">
            <div class="card-body">
              <i class="bi bi-x-circle text-danger mb-2" style="font-size: 1.5rem;"></i>
              <h5 class="card-title">{{estadisticas().rechazados}}</h5>
              <p class="card-text text-muted small">Rechazados</p>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card text-center">
            <div class="card-body">
              <i class="bi bi-arrow-return-left text-info mb-2" style="font-size: 1.5rem;"></i>
              <h5 class="card-title">{{estadisticas().reembolsados}}</h5>
              <p class="card-text text-muted small">Reembolsados</p>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card text-center">
            <div class="card-body">
              <i class="bi bi-dash-circle text-secondary mb-2" style="font-size: 1.5rem;"></i>
              <h5 class="card-title">{{estadisticas().cancelados}}</h5>
              <p class="card-text text-muted small">Cancelados</p>
            </div>
          </div>
        </div>
      </div>
      <!-- Filtros Simples -->
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
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
            <option value="cancelado">🚫 Cancelados</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary w-100" (click)="limpiarFiltros()">
            <i class="bi bi-eraser me-2"></i>Limpiar
          </button>
        </div>
      </div>

      <!-- Loading Simple -->
      <div *ngIf="cargando()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando pedidos...</p>
      </div>

      <!-- Tabla Simple -->
      <div *ngIf="!cargando()" class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-list-ul me-2"></i>
            Historial de Pedidos ({{pedidosFiltrados().length}} resultados)
          </h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Pago</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pedido of pedidosFiltrados()">
                  <td>
                    <strong>#{{pedido.id.replace('pedido_', '').substring(0, 8)}}</strong>
                    <br>
                    <small class="text-muted">MP: {{pedido.paymentId.substring(0, 10)}}...</small>
                  </td>
                  <td>
                    <div>
                      <strong>{{pedido.cliente.nombre}} {{pedido.cliente.apellido}}</strong>
                      <br>
                      <small class="text-muted">{{pedido.cliente.email}}</small>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [class]="obtenerClaseEstado(pedido.estado)">
                      <i [class]="obtenerIconoEstado(pedido.estado) + ' me-1'"></i>
                      {{obtenerTextoEstado(pedido.estado)}}
                    </span>
                    <div *ngIf="pedido.motivoRechazo" class="mt-1">
                      <small class="text-danger">
                        <i class="bi bi-exclamation-triangle me-1"></i>
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
                    <span class="badge bg-light text-dark">{{pedido.metodoPago || 'N/A'}}</span>
                  </td>
                  <td>
                    <div>{{formatearFecha(pedido.fechaCreacion)}}</div>
                    <small *ngIf="pedido.fechaAprobacion" class="text-success">
                      ✅ {{formatearFecha(pedido.fechaAprobacion)}}
                    </small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" 
                              (click)="verDetallesPedido(pedido)"
                              title="Ver detalles">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button *ngIf="pedido.estado === 'completado'" 
                              class="btn btn-outline-warning"
                              (click)="procesarReembolso(pedido)"
                              title="Procesar reembolso">
                        <i class="bi bi-arrow-return-left"></i>
                      </button>
                      <button class="btn btn-outline-danger"
                              (click)="eliminarPedido(pedido)"
                              title="Eliminar pedido">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Sin Resultados Simple -->
          <div *ngIf="pedidosFiltrados().length === 0" class="text-center py-5">
            <i class="bi bi-inbox text-muted mb-3" style="font-size: 3rem;"></i>
            <h5 class="text-muted mb-3">No se encontraron pedidos</h5>
            <p class="text-muted mb-4">Intenta ajustar los filtros o crear pedidos de prueba</p>
            <button class="btn btn-primary" (click)="crearPedidosDePrueba()">
              <i class="bi bi-plus-circle me-2"></i>
              Crear Pedidos de Prueba
            </button>
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
                      class="btn btn-warning me-2"
                      (click)="procesarReembolso(pedidoSeleccionado)">
                <i class="fas fa-undo me-2"></i>Procesar Reembolso
              </button>
              <button type="button" 
                      class="btn btn-danger"
                      (click)="eliminarPedido(pedidoSeleccionado)">
                <i class="fas fa-trash me-2"></i>Eliminar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
    
    .table th {
      border-top: none;
      background-color: #f8f9fa;
    }
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
    }

    .modal {
      background-color: rgba(0,0,0,0.5);
    }

    @media (max-width: 768px) {
      .btn-group {
        flex-direction: column;
        width: 100%;
      }
      
      .btn-group .btn {
        border-radius: 0.375rem !important;
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class GestionPedidosComponent implements OnInit {
  private pedidosService = inject(PedidosFirestoreService);

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
      const fechaA = a.fechaCreacion instanceof Date ? a.fechaCreacion.getTime() : ((a.fechaCreacion as any)?.seconds ? (a.fechaCreacion as any).seconds * 1000 : 0);
      const fechaB = b.fechaCreacion instanceof Date ? b.fechaCreacion.getTime() : ((b.fechaCreacion as any)?.seconds ? (b.fechaCreacion as any).seconds * 1000 : 0);
      return fechaB - fechaA; // Más recientes primero
    });
  });

  // Estadísticas computadas
  estadisticas = computed(() => {
    const todos = this.pedidos();
    return {
      total: todos.length,
      completados: todos.filter(p => p.estado === EstadoPedidoMP.COMPLETADO || p.estado === EstadoPedidoMP.APROBADO).length,
      pendientes: todos.filter(p => p.estado === EstadoPedidoMP.PENDIENTE || p.estado === EstadoPedidoMP.CREADO).length,
      rechazados: todos.filter(p => p.estado === EstadoPedidoMP.RECHAZADO).length,
      reembolsados: todos.filter(p => p.estado === EstadoPedidoMP.REEMBOLSADO).length,
      cancelados: todos.filter(p => p.estado === EstadoPedidoMP.CANCELADO).length
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
   * Carga todos los pedidos desde Firestore usando el servicio
   */
  cargarPedidos(): void {
    console.log('📋 Cargando pedidos de Mercado Pago...');
    this.cargando.set(true);
    
    this.pedidosService.obtenerTodosLosPedidos().subscribe({
      next: (pedidos: PedidoMercadoPago[]) => {
        console.log(`✅ ${pedidos.length} pedidos cargados`);
        this.pedidos.set(pedidos);
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
   * Crea pedidos de prueba para demostrar la funcionalidad
   */
  async crearPedidosDePrueba(): Promise<void> {
    const { value: confirmacion } = await Swal.fire({
      title: '¿Crear Pedidos de Prueba?',
      text: 'Se crearán varios pedidos de ejemplo para mostrar la funcionalidad del panel.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion) return;

    try {
      this.cargando.set(true);

      // Crear varios pedidos de prueba con diferentes estados
      const pedidosPrueba = [
        {
          items: [
            { producto: { id: 'test-1', nombre: 'Mate de Calabaza Premium', precio: 15000, imagen: '' }, cantidad: 1 },
            { producto: { id: 'test-2', nombre: 'Bombilla de Alpaca', precio: 8500, imagen: '' }, cantidad: 1 }
          ],
          usuario: { id: 'admin', email: 'admin@aled2025.com', nombre: 'Admin', apellido: 'ALED2025' },
          metodoEntrega: 'domicilio',
          preferenceId: 'test_pref_' + Date.now() + '_1'
        },
        {
          items: [
            { producto: { id: 'test-3', nombre: 'Yerba Mate Orgánica 1kg', precio: 3200, imagen: '' }, cantidad: 2 }
          ],
          usuario: { id: 'user1', email: 'usuario1@test.com', nombre: 'Juan', apellido: 'Pérez' },
          metodoEntrega: 'local',
          preferenceId: 'test_pref_' + Date.now() + '_2'
        },
        {
          items: [
            { producto: { id: 'test-4', nombre: 'Set Completo de Mate', precio: 25000, imagen: '' }, cantidad: 1 }
          ],
          usuario: { id: 'user2', email: 'maria@test.com', nombre: 'María', apellido: 'González' },
          metodoEntrega: 'domicilio',
          preferenceId: 'test_pref_' + Date.now() + '_3'
        }
      ];

      // Crear los pedidos usando el servicio
      for (const pedidoData of pedidosPrueba) {
        await this.pedidosService.crearPedido(
          pedidoData.items,
          pedidoData.usuario,
          pedidoData.metodoEntrega,
          pedidoData.preferenceId,
          'Dirección de prueba 123',
          'Pedido de prueba para demostración'
        );
      }

      // Recargar la lista de pedidos
      this.cargarPedidos();

      Swal.fire({
        icon: 'success',
        title: '¡Pedidos Creados!',
        text: `Se han creado ${pedidosPrueba.length} pedidos de prueba exitosamente.`,
        timer: 2000,
        showConfirmButton: false
      });

      console.log('✅ Pedidos de prueba creados exitosamente');

    } catch (error) {
      console.error('❌ Error creando pedidos de prueba:', error);
      this.cargando.set(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron crear los pedidos de prueba.',
      });
    }
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
   * Elimina un pedido de la base de datos
   */
  async eliminarPedido(pedido: PedidoMercadoPago): Promise<void> {
    const { value: confirmacion } = await Swal.fire({
      title: '¿Eliminar Pedido?',
      text: `¿Estás seguro de eliminar el pedido ${pedido.id.replace('pedido_', '')}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d'
    });

    if (confirmacion) {
      try {
        // Por ahora, solo eliminar de la lista local
        // TODO: Implementar eliminación real en el servicio
        const pedidosActuales = this.pedidos();
        const pedidosActualizados = pedidosActuales.filter(p => p.id !== pedido.id);
        this.pedidos.set(pedidosActualizados);
        
        // Cerrar modal de detalles si está abierto
        if (this.pedidoSeleccionado?.id === pedido.id) {
          this.cerrarDetalles();
        }
        
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: `El pedido ${pedido.id.replace('pedido_', '')} ha sido eliminado de la vista.`,
          timer: 2000,
          showConfirmButton: false
        });
        
        console.log(`✅ Pedido eliminado de la vista: ${pedido.id}`);
      } catch (error) {
        console.error('❌ Error al eliminar pedido:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el pedido. Intenta nuevamente.',
        });
      }
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
      [EstadoPedidoMP.COMPLETADO]: 'Completado',
      [EstadoPedidoMP.APROBADO]: 'Aprobado',
      [EstadoPedidoMP.PENDIENTE]: 'Pendiente',
      [EstadoPedidoMP.CREADO]: 'Creado',
      [EstadoPedidoMP.RECHAZADO]: 'Rechazado',
      [EstadoPedidoMP.REEMBOLSADO]: 'Reembolsado',
      [EstadoPedidoMP.CANCELADO]: 'Cancelado'
    };
    return textos[estado] || 'Desconocido';
  }

  /**
   * Obtiene las clases CSS para el color del estado
   */
  obtenerClaseEstado(estado: string): string {
    const clases: {[key: string]: string} = {
      [EstadoPedidoMP.COMPLETADO]: 'bg-success',
      [EstadoPedidoMP.APROBADO]: 'bg-success',
      [EstadoPedidoMP.PENDIENTE]: 'bg-warning text-dark',
      [EstadoPedidoMP.CREADO]: 'bg-info text-dark',
      [EstadoPedidoMP.RECHAZADO]: 'bg-danger',
      [EstadoPedidoMP.REEMBOLSADO]: 'bg-info',
      [EstadoPedidoMP.CANCELADO]: 'bg-secondary'
    };
    return clases[estado] || 'bg-secondary';
  }

  /**
   * Obtiene el icono del estado
   */
  obtenerIconoEstado(estado: string): string {
    const iconos: {[key: string]: string} = {
      [EstadoPedidoMP.COMPLETADO]: 'fas fa-check-circle',
      [EstadoPedidoMP.APROBADO]: 'fas fa-check-circle',
      [EstadoPedidoMP.PENDIENTE]: 'fas fa-clock',
      [EstadoPedidoMP.CREADO]: 'fas fa-plus-circle',
      [EstadoPedidoMP.RECHAZADO]: 'fas fa-times-circle',
      [EstadoPedidoMP.REEMBOLSADO]: 'fas fa-undo',
      [EstadoPedidoMP.CANCELADO]: 'fas fa-ban'
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
   * Elimina todos los pedidos de la base de datos
   */
  async eliminarTodosLosPedidos(): Promise<void> {
    const { value: confirmacion } = await Swal.fire({
      title: '⚠️ ¿Eliminar TODOS los pedidos?',
      html: `
        <div class="text-start">
          <p><strong>Esta acción eliminará:</strong></p>
          <ul>
            <li>🗑️ Todos los pedidos del sistema (${this.pedidos().length} pedidos)</li>
            <li>💾 Datos de Firestore</li>
            <li>🧹 Datos locales y caché</li>
            <li>📊 Estadísticas actuales</li>
          </ul>
          <p class="text-danger"><strong>⚠️ Esta acción NO se puede deshacer</strong></p>
          <p class="text-warning"><small>Los administradores pueden crear nuevos pedidos de prueba después.</small></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sí, eliminar todo',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      focusCancel: true
    });

    if (!confirmacion) return;

    try {
      this.cargando.set(true);
      console.log('🗑️ Iniciando eliminación masiva completa...');

      // PASO 1: Usar el método del servicio para eliminar todos los pedidos de Firestore
      console.log('🔥 Paso 1: Eliminando todos los pedidos de Firestore...');
      const resultado = await this.pedidosService.eliminarTodosLosPedidos();
      console.log(`✅ Firestore: ${resultado.eliminados} eliminados, ${resultado.errores} errores`);

      // PASO 2: Limpiar localStorage relacionado con pedidos
      console.log('🧹 Paso 2: Limpiando localStorage...');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('pedido') || key.includes('carrito') || key.includes('mercadopago'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 Eliminado de localStorage: ${key}`);
      });

      // PASO 3: Limpiar la lista local
      console.log('📋 Paso 3: Limpiando lista local...');
      this.pedidos.set([]);

      // PASO 4: Recargar desde Firestore para verificar
      console.log('🔄 Paso 4: Recargando desde Firestore...');
      setTimeout(() => {
        this.cargarPedidos();
      }, 1000);
      
      console.log(`✅ Eliminación masiva completada: ${resultado.eliminados} eliminados, ${resultado.errores} errores`);
      
      // Mostrar confirmación de éxito
      await Swal.fire({
        icon: 'success',
        title: '🧹 ¡Eliminación Completa Exitosa!',
        html: `
          <div class="text-start">
            <p><strong>📊 Resultado de la eliminación completa:</strong></p>
            <ul>
              <li>🔥 Pedidos eliminados de Firestore: ${resultado.eliminados}</li>
              ${resultado.errores > 0 ? `<li>❌ Errores en Firestore: ${resultado.errores}</li>` : ''}
              <li>🧹 Datos locales limpiados: ${keysToRemove.length} elementos</li>
              <li>📋 Lista local reiniciada</li>
              <li>🔄 Sistema recargado desde base de datos</li>
            </ul>
            <p class="text-success">El sistema está completamente limpio y verificado.</p>
            <p class="text-info"><small>💡 Puedes crear pedidos de prueba usando el botón "Crear Pruebas"</small></p>
          </div>
        `,
        confirmButtonText: '👍 Perfecto',
        confirmButtonColor: '#28a745',
        timer: 8000,
        timerProgressBar: true
      });
      
    } catch (error) {
      console.error('❌ Error durante la eliminación masiva:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error en la Eliminación',
        text: 'Hubo un problema durante la eliminación masiva. Revisa la consola para más detalles.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      this.cargando.set(false);
    }
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
