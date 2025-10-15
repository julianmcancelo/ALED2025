// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

// Importaciones de servicios del proyecto
import { AuthService } from '../auth/auth';
import { PedidosService } from '../servicios/pedidos.service';

// Importaciones de modelos
import { Pedido, EstadoPedido } from '../shared/models/pedido.model';

/**
 * ============================================================================
 * COMPONENTE MIS PEDIDOS - HISTORIAL DE COMPRAS DEL USUARIO
 * ============================================================================
 * 
 * Este componente permite a los usuarios autenticados visualizar el historial
 * completo de sus pedidos realizados en el e-commerce ALED2025. Proporciona
 * información detallada sobre el estado, productos y pagos de cada pedido.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Visualización del historial completo de pedidos del usuario
 * - Filtros por estado de pedido (completado, pendiente, rechazado, etc.)
 * - Vista detallada de cada pedido con productos y montos
 * - Información de estado de pago y entrega
 * - Acciones disponibles según el estado del pedido
 * - Interfaz responsiva y moderna
 * 
 * TECNOLOGÍAS UTILIZADAS:
 * - Angular Signals para estado reactivo
 * - Angular Router para navegación
 * - SweetAlert2 para notificaciones elegantes
 * - Bootstrap para diseño responsivo
 * - TypeScript para tipado fuerte
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */
@Component({
  selector: 'app-mis-pedidos',
  standalone: true, // Componente independiente para mejor tree-shaking
  imports: [
    CommonModule,             // Directivas básicas de Angular (*ngIf, *ngFor, etc.)
    FormsModule              // Para formularios template-driven y ngModel
  ],
  template: `
    <div class="container mt-4">
      <!-- Header del componente -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-bag-check me-2"></i>
                Mis Pedidos
              </h2>
              <p class="text-muted mb-0">
                Historial completo de tus compras
              </p>
            </div>
            <div>
              <button 
                class="btn btn-outline-primary"
                (click)="cargarPedidos()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas de pedidos -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Completados</h6>
                  <h3 class="mb-0">{{ estadisticas().completados }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-check-circle fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Pendientes</h6>
                  <h3 class="mb-0">{{ estadisticas().pendientes }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-clock fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Total Pedidos</h6>
                  <h3 class="mb-0">{{ estadisticas().total }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-bag fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Total Gastado</h6>
                  <h3 class="mb-0">{{ estadisticas().totalGastado | currency:'ARS':'symbol':'1.0-0' }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-cash fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="row mb-4">
        <div class="col-md-6">
          <label class="form-label">Filtrar por estado:</label>
          <select 
            class="form-select"
            [(ngModel)]="filtroEstado"
            (ngModelChange)="aplicarFiltros()">
            <option value="todos">Todos los estados</option>
            <option value="completado">Completados</option>
            <option value="pendiente">Pendientes</option>
            <option value="rechazado">Rechazados</option>
            <option value="reembolsado">Reembolsados</option>
          </select>
        </div>
      </div>

      <!-- Lista de pedidos -->
      <div class="row">
        <div class="col-12">
          <!-- Sin pedidos -->
          <div *ngIf="pedidosFiltrados().length === 0" class="text-center py-5">
            <i class="bi bi-bag-x display-1 text-muted"></i>
            <h4 class="mt-3">No tienes pedidos</h4>
            <p class="text-muted">
              Aún no has realizado ninguna compra.
            </p>
            <div class="d-flex gap-2 justify-content-center">
              <button 
                class="btn btn-primary"
                (click)="irATienda()">
                <i class="bi bi-shop me-1"></i>
                Ir a la Tienda
              </button>
              <button 
                class="btn btn-outline-secondary"
                (click)="generarDatosDemo()"
                title="Generar pedidos de demostración para probar la funcionalidad">
                <i class="bi bi-gear me-1"></i>
                Datos Demo
              </button>
            </div>
          </div>

          <!-- Tarjetas de pedidos -->
          <div *ngIf="pedidosFiltrados().length > 0" class="row">
            <div class="col-md-6 mb-4" *ngFor="let pedido of pedidosFiltrados()">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-0">Pedido #{{ pedido.numeroPedido }}</h6>
                    <small class="text-muted">{{ pedido.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}</small>
                  </div>
                  <span [class]="'badge ' + obtenerClaseEstado(pedido.estado)">
                    {{ obtenerTextoEstado(pedido.estado) }}
                  </span>
                </div>
                <div class="card-body">
                  <!-- Información del pedido -->
                  <div class="mb-3">
                    <h6>Total: <span class="text-success">{{ pedido.total | currency:'ARS':'symbol':'1.0-0' }}</span></h6>
                    <p class="mb-1"><strong>Método de pago:</strong> {{ pedido.pago.metodoPago }}</p>
                    <p class="mb-1"><strong>Transaction ID:</strong> <code>{{ pedido.pago.transaccionId || 'N/A' }}</code></p>
                  </div>

                  <!-- Productos del pedido -->
                  <div class="mb-3">
                    <h6>Productos ({{ pedido.items.length }}):</h6>
                    <div class="list-group list-group-flush">
                      <div 
                        class="list-group-item px-0 py-2" 
                        *ngFor="let item of pedido.items">
                        <div class="d-flex justify-content-between">
                          <div>
                            <strong>{{ item.nombre }}</strong>
                            <br>
                            <small class="text-muted">Cantidad: {{ item.cantidad }}</small>
                          </div>
                          <div class="text-end">
                            <strong>{{ item.subtotal | currency:'ARS':'symbol':'1.0-0' }}</strong>
                            <br>
                            <small class="text-muted">{{ item.precioUnitario | currency:'ARS':'symbol':'1.0-0' }} c/u</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Información adicional según estado -->
                  <div *ngIf="pedido.pago.motivoRechazo" class="alert alert-danger">
                    <strong>Motivo de rechazo:</strong> {{ pedido.pago.motivoRechazo }}
                  </div>

                  <div *ngIf="pedido.pago.fechaPago" class="text-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Pagado el {{ pedido.pago.fechaPago | date:'dd/MM/yyyy HH:mm' }}
                  </div>
                </div>
                <div class="card-footer">
                  <div class="d-flex gap-2">
                    <button 
                      class="btn btn-outline-primary btn-sm"
                      (click)="verDetalles(pedido)">
                      <i class="bi bi-eye me-1"></i>
                      Ver Detalles
                    </button>
                    <button 
                      *ngIf="pedido.estado === 'entregado'"
                      class="btn btn-outline-success btn-sm"
                      (click)="descargarFactura(pedido)">
                      <i class="bi bi-download me-1"></i>
                      Factura
                    </button>
                    <button 
                      *ngIf="pedido.estado === 'pendiente' || pedido.estado === 'preparando' || pedido.estado === 'enviado'"
                      class="btn btn-outline-warning btn-sm"
                      (click)="consultarEstado(pedido)">
                      <i class="bi bi-question-circle me-1"></i>
                      Consultar Estado
                    </button>
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
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border: 1px solid rgba(0, 0, 0, 0.125);
      transition: transform 0.2s;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    }

    .list-group-item {
      border: none;
      border-bottom: 1px solid #dee2e6;
    }

    .list-group-item:last-child {
      border-bottom: none;
    }

    .badge {
      font-size: 0.75em;
    }
  `]
})
export class MisPedidosComponent implements OnInit {

  // --- INYECCIÓN DE DEPENDENCIAS ---

  /**
   * AuthService: Servicio de autenticación para verificar usuario logueado
   * y obtener información del usuario actual.
   */
  private authService = inject(AuthService);

  /**
   * Router: Servicio de navegación de Angular para redireccionar
   * a otras páginas de la aplicación.
   */
  private router = inject(Router);

  /**
   * PedidosService: Servicio para gestionar operaciones con pedidos
   */
  private pedidosService = inject(PedidosService);

  // --- PROPIEDADES DEL COMPONENTE ---

  /**
   * Signal que contiene la lista completa de pedidos del usuario.
   * Se actualiza automáticamente cuando se cargan nuevos datos.
   */
  pedidos = signal<Pedido[]>([]);

  /**
   * Filtro actual por estado de pedido.
   * Controla qué pedidos se muestran en la interfaz.
   */
  filtroEstado = 'todos';

  // --- COMPUTED SIGNALS (Señales Computadas) ---

  /**
   * Computed Signal que filtra los pedidos según el estado seleccionado.
   * Se recalcula automáticamente cuando cambian los filtros o los pedidos.
   */
  pedidosFiltrados = computed(() => {
    const todos = this.pedidos();
    
    if (this.filtroEstado === 'todos') {
      return todos;
    }
    
    return todos.filter(pedido => pedido.estado === this.filtroEstado);
  });

  /**
   * Computed Signal que calcula estadísticas de los pedidos.
   * Proporciona contadores y totales para las tarjetas de resumen.
   */
  estadisticas = computed(() => {
    const todos = this.pedidos();
    
    return {
      total: todos.length,
      completados: todos.filter(p => p.estado === 'entregado').length,
      pendientes: todos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando' || p.estado === 'enviado').length,
      rechazados: todos.filter(p => p.estado === 'rechazado' || p.estado === 'cancelado').length,
      totalGastado: todos
        .filter(p => p.estado === 'entregado' || p.estado === 'pagado')
        .reduce((sum, p) => sum + p.total, 0)
    };
  });

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---

  /**
   * Método que se ejecuta automáticamente cuando el componente se inicializa.
   * Aquí verificamos la autenticación y cargamos los pedidos del usuario.
   */
  ngOnInit(): void {
    // Verificar que el usuario esté autenticado
    this.verificarAutenticacion();
    
    // Cargar pedidos del usuario
    this.cargarPedidos();
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---

  /**
   * Verifica que el usuario esté autenticado.
   * Si no lo está, redirige al login.
   */
  private verificarAutenticacion(): void {
    const usuario = this.authService.currentUserSignal();
    
    if (!usuario) {
      Swal.fire({
        icon: 'warning',
        title: 'Acceso restringido',
        text: 'Debes iniciar sesión para ver tus pedidos',
        confirmButtonText: 'Ir al Login'
      }).then(() => {
        this.router.navigate(['/']);
      });
    }
  }

  // --- MÉTODOS DE GESTIÓN DE DATOS ---

  /**
   * Carga los pedidos del usuario autenticado.
   */
  async cargarPedidos(): Promise<void> {
    const usuario = this.authService.currentUserSignal();
    
    if (!usuario) {
      return;
    }

    try {
      console.log('🛒 Cargando pedidos del usuario...');
      
      const resultado = await this.pedidosService.obtenerPedidosUsuario(usuario.id!);
      
      if (resultado.exito && resultado.pedidos) {
        this.pedidos.set(resultado.pedidos);
        console.log(`✅ Se cargaron ${resultado.pedidos.length} pedidos`);
      } else {
        console.warn('⚠️ No se pudieron cargar los pedidos:', resultado.mensaje);
        // No hay pedidos reales, mostrar lista vacía
        this.pedidos.set([]);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      // En caso de error, mostrar lista vacía
      this.pedidos.set([]);
    }
  }

  /**
   * Genera pedidos de demostración para el usuario.
   * En una aplicación real, esto vendría del backend.
   * 
   * @param usuarioId - ID del usuario para asociar los pedidos
   */
  private generarPedidosDemostacion(usuarioId: string): void {
    const pedidosDemo: Pedido[] = [
      {
        id: 'demo-ped-001',
        numeroPedido: 'ALED-240115-A1B2',
        usuarioId,
        cliente: {
          nombre: 'Usuario',
          apellido: 'Demo',
          email: 'usuario@demo.com',
          telefono: '123456789'
        },
        estado: 'entregado',
        items: [
          {
            id: 'item-1',
            productoId: 'prod-001',
            nombre: 'Smartphone Samsung Galaxy A54',
            descripcion: 'Smartphone con cámara de 50MP',
            precioUnitario: 89999,
            cantidad: 1,
            subtotal: 89999
          }
        ],
        envio: {
          direccion: 'Av. Corrientes 1234',
          ciudad: 'Buenos Aires',
          codigoPostal: '1043',
          provincia: 'CABA',
          pais: 'Argentina',
          costoEnvio: 0,
          metodoEnvio: 'Envío gratis',
          tiempoEstimado: '3-5 días hábiles'
        },
        pago: {
          metodoPago: 'tarjeta_virtual',
          transaccionId: 'txn-123456',
          estadoPago: 'aprobado',
          montoPagado: 89999,
          moneda: 'ARS',
          fechaPago: new Date('2025-01-10')
        },
        subtotal: 89999,
        totalDescuentos: 0,
        costoEnvio: 0,
        total: 89999,
        fechaCreacion: new Date('2025-01-10'),
        fechaActualizacion: new Date('2025-01-15'),
        fechaEntregaReal: new Date('2025-01-15'),
        historialEstados: [
          {
            estadoNuevo: 'creado',
            fecha: new Date('2025-01-10'),
            motivo: 'Pedido creado'
          },
          {
            estadoAnterior: 'creado',
            estadoNuevo: 'entregado',
            fecha: new Date('2025-01-15'),
            motivo: 'Pedido entregado exitosamente'
          }
        ]
      },
      {
        id: 'demo-ped-002',
        numeroPedido: 'ALED-240112-C3D4',
        usuarioId,
        cliente: {
          nombre: 'Usuario',
          apellido: 'Demo',
          email: 'usuario@demo.com',
          telefono: '123456789'
        },
        estado: 'enviado',
        items: [
          {
            id: 'item-2',
            productoId: 'prod-005',
            nombre: 'Zapatillas Running Adidas Ultraboost',
            descripcion: 'Zapatillas deportivas premium',
            precioUnitario: 22000,
            cantidad: 1,
            subtotal: 22000
          }
        ],
        envio: {
          direccion: 'Av. Corrientes 1234',
          ciudad: 'Buenos Aires',
          codigoPostal: '1043',
          provincia: 'CABA',
          pais: 'Argentina',
          costoEnvio: 2500,
          metodoEnvio: 'Envío estándar',
          tiempoEstimado: '3-5 días hábiles',
          numeroSeguimiento: 'AR123456789'
        },
        pago: {
          metodoPago: 'tarjeta_virtual',
          transaccionId: 'txn-987654',
          estadoPago: 'aprobado',
          montoPagado: 24500,
          moneda: 'ARS',
          fechaPago: new Date('2025-01-12')
        },
        subtotal: 22000,
        totalDescuentos: 0,
        costoEnvio: 2500,
        total: 24500,
        fechaCreacion: new Date('2025-01-12'),
        fechaActualizacion: new Date('2025-01-13'),
        historialEstados: [
          {
            estadoNuevo: 'creado',
            fecha: new Date('2025-01-12'),
            motivo: 'Pedido creado'
          },
          {
            estadoAnterior: 'pagado',
            estadoNuevo: 'enviado',
            fecha: new Date('2025-01-13'),
            motivo: 'Pedido enviado'
          }
        ]
      },
      {
        id: 'demo-ped-003',
        numeroPedido: 'ALED-240108-E5F6',
        usuarioId,
        cliente: {
          nombre: 'Usuario',
          apellido: 'Demo',
          email: 'usuario@demo.com',
          telefono: '123456789'
        },
        estado: 'rechazado',
        items: [
          {
            id: 'item-3',
            productoId: 'prod-003',
            nombre: 'Remera Deportiva Nike Dri-FIT',
            descripcion: 'Remera deportiva transpirable',
            precioUnitario: 8500,
            cantidad: 1,
            subtotal: 8500
          }
        ],
        envio: {
          direccion: 'Av. Corrientes 1234',
          ciudad: 'Buenos Aires',
          codigoPostal: '1043',
          provincia: 'CABA',
          pais: 'Argentina',
          costoEnvio: 2500,
          metodoEnvio: 'Envío estándar',
          tiempoEstimado: '3-5 días hábiles'
        },
        pago: {
          metodoPago: 'tarjeta_virtual',
          estadoPago: 'rechazado',
          montoPagado: 0,
          moneda: 'ARS',
          motivoRechazo: 'Fondos insuficientes en tarjeta virtual'
        },
        subtotal: 8500,
        totalDescuentos: 0,
        costoEnvio: 2500,
        total: 11000,
        fechaCreacion: new Date('2025-01-08'),
        fechaActualizacion: new Date('2025-01-08'),
        historialEstados: [
          {
            estadoNuevo: 'creado',
            fecha: new Date('2025-01-08'),
            motivo: 'Pedido creado'
          },
          {
            estadoAnterior: 'creado',
            estadoNuevo: 'rechazado',
            fecha: new Date('2025-01-08'),
            motivo: 'Pago rechazado por fondos insuficientes'
          }
        ]
      }
    ];

    this.pedidos.set(pedidosDemo);
  }

  // --- MÉTODOS DE FILTRADO ---

  /**
   * Aplica los filtros seleccionados a la lista de pedidos.
   * Los computed signals se actualizan automáticamente.
   */
  aplicarFiltros(): void {
    // Los computed signals se actualizan automáticamente
    // No necesitamos hacer nada más aquí
  }

  // --- MÉTODOS DE ACCIONES ---

  /**
   * Muestra los detalles completos de un pedido en un modal.
   * 
   * @param pedido - El pedido del cual mostrar los detalles
   */
  verDetalles(pedido: Pedido): void {
    const productosHtml = pedido.items.map(item => `
      <div class="d-flex justify-content-between mb-2">
        <span>${item.nombre} (x${item.cantidad})</span>
        <strong>$${item.subtotal.toLocaleString()}</strong>
      </div>
    `).join('');

    Swal.fire({
      title: `Detalles del Pedido #${pedido.numeroPedido}`,
      html: `
        <div class="text-start">
          <h6><strong>Estado:</strong></h6>
          <p><span class="badge ${this.obtenerClaseEstado(pedido.estado)}">${this.obtenerTextoEstado(pedido.estado)}</span></p>
          
          <h6><strong>Total:</strong></h6>
          <p class="text-success fs-5"><strong>$${pedido.total.toLocaleString()}</strong></p>
          
          <h6><strong>Método de Pago:</strong></h6>
          <p>${pedido.pago.metodoPago}</p>
          
          <h6><strong>Transaction ID:</strong></h6>
          <p><code>${pedido.pago.transaccionId || 'N/A'}</code></p>
          
          <h6><strong>Fecha de Creación:</strong></h6>
          <p>${pedido.fechaCreacion.toLocaleDateString()}</p>
          
          <h6><strong>Dirección de Envío:</strong></h6>
          <p>${pedido.envio.direccion}, ${pedido.envio.ciudad}</p>
          
          <h6><strong>Productos:</strong></h6>
          <div class="border rounded p-2">
            ${productosHtml}
          </div>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar'
    });
  }

  /**
   * Simula la descarga de factura para pedidos completados.
   * 
   * @param pedido - El pedido para el cual descargar la factura
   */
  descargarFactura(pedido: Pedido): void {
    Swal.fire({
      icon: 'info',
      title: 'Descarga de Factura',
      text: `La funcionalidad de descarga de factura para el pedido #${pedido.id} estará disponible próximamente.`,
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Consulta el estado actual de un pedido pendiente.
   * 
   * @param pedido - El pedido del cual consultar el estado
   */
  consultarEstado(pedido: Pedido): void {
    Swal.fire({
      icon: 'info',
      title: 'Consulta de Estado',
      text: `El pedido #${pedido.id} está siendo procesado. Te notificaremos cuando haya novedades.`,
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Navega a la página de la tienda.
   */
  irATienda(): void {
    this.router.navigate(['/tienda']);
  }

  /**
   * Genera datos de demostración para probar la funcionalidad
   */
  generarDatosDemo(): void {
    const usuario = this.authService.currentUserSignal();
    if (!usuario) return;

    Swal.fire({
      title: 'Generar Datos Demo',
      text: '¿Quieres generar pedidos de demostración para probar la funcionalidad?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.generarPedidosDemostacion(usuario.id!);
        Swal.fire({
          icon: 'success',
          title: 'Datos Demo Generados',
          text: 'Se han creado pedidos de demostración para probar la funcionalidad.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  // --- MÉTODOS AUXILIARES ---

  /**
   * Obtiene la clase CSS apropiada para el estado del pedido.
   * 
   * @param estado - El estado del pedido
   * @returns La clase CSS correspondiente
   */
  obtenerClaseEstado(estado: EstadoPedido): string {
    const clases = {
      'creado': 'bg-secondary',
      'pendiente': 'bg-warning text-dark',
      'pagado': 'bg-primary',
      'preparando': 'bg-info',
      'enviado': 'bg-warning text-dark',
      'entregado': 'bg-success',
      'cancelado': 'bg-secondary',
      'rechazado': 'bg-danger',
      'reembolsado': 'bg-info'
    };

    return clases[estado] || 'bg-secondary';
  }

  /**
   * Obtiene el texto descriptivo para el estado del pedido.
   * 
   * @param estado - El estado del pedido
   * @returns El texto descriptivo correspondiente
   */
  obtenerTextoEstado(estado: EstadoPedido): string {
    const textos = {
      'creado': 'Creado',
      'pendiente': 'Pendiente',
      'pagado': 'Pagado',
      'preparando': 'Preparando',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado',
      'reembolsado': 'Reembolsado'
    };

    return textos[estado] || 'Desconocido';
  }

  /**
   * Obtiene una fecha válida para ordenar pedidos.
   * Convierte diferentes tipos de fecha a un objeto Date válido.
   * 
   * @param fecha - La fecha a convertir (puede ser Date, string, timestamp, etc.)
   * @returns Un objeto Date válido para ordenamiento
   */
  obtenerFechaParaOrdenar(fecha: any): Date {
    if (fecha instanceof Date) {
      return fecha;
    }
    
    if (typeof fecha === 'string') {
      return new Date(fecha);
    }
    
    if (typeof fecha === 'number') {
      return new Date(fecha);
    }
    
    // Si no se puede convertir, retorna una fecha muy antigua para que vaya al final
    return new Date(0);
  }
}
