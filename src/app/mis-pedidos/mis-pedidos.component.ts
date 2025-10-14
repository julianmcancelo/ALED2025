// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

// Importaciones de servicios del proyecto
import { AuthService } from '../auth/auth';

// --- INTERFACES Y TIPOS ---

/**
 * Interfaz que define la estructura de un pedido del usuario.
 */
interface PedidoDemo {
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
  fechaCreacion: Date;
  fechaAprobacion?: Date;
  fechaActualizacion?: Date;
  motivoRechazo?: string;
  detallesPago?: any;
}

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
            <button 
              class="btn btn-primary"
              (click)="irATienda()">
              <i class="bi bi-shop me-1"></i>
              Ir a la Tienda
            </button>
          </div>

          <!-- Tarjetas de pedidos -->
          <div *ngIf="pedidosFiltrados().length > 0" class="row">
            <div class="col-md-6 mb-4" *ngFor="let pedido of pedidosFiltrados()">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-0">Pedido #{{ pedido.id }}</h6>
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
                    <p class="mb-1"><strong>Método de pago:</strong> {{ pedido.metodoPago }}</p>
                    <p class="mb-1"><strong>Payment ID:</strong> <code>{{ pedido.paymentId }}</code></p>
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
                            <small class="text-muted">{{ item.precio | currency:'ARS':'symbol':'1.0-0' }} c/u</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Información adicional según estado -->
                  <div *ngIf="pedido.motivoRechazo" class="alert alert-danger">
                    <strong>Motivo de rechazo:</strong> {{ pedido.motivoRechazo }}
                  </div>

                  <div *ngIf="pedido.fechaAprobacion" class="text-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Aprobado el {{ pedido.fechaAprobacion | date:'dd/MM/yyyy HH:mm' }}
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
                      *ngIf="pedido.estado === 'completado'"
                      class="btn btn-outline-success btn-sm"
                      (click)="descargarFactura(pedido)">
                      <i class="bi bi-download me-1"></i>
                      Factura
                    </button>
                    <button 
                      *ngIf="pedido.estado === 'pendiente'"
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

  // --- PROPIEDADES DEL COMPONENTE ---

  /**
   * Signal que contiene la lista completa de pedidos del usuario.
   * Se actualiza automáticamente cuando se cargan nuevos datos.
   */
  pedidos = signal<PedidoDemo[]>([]);

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
      completados: todos.filter(p => p.estado === 'completado').length,
      pendientes: todos.filter(p => p.estado === 'pendiente').length,
      rechazados: todos.filter(p => p.estado === 'rechazado').length,
      totalGastado: todos
        .filter(p => p.estado === 'completado')
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
   * En una aplicación real, esto haría una llamada al backend.
   */
  cargarPedidos(): void {
    const usuario = this.authService.currentUserSignal();
    
    if (!usuario) {
      return;
    }

    // Simular carga de pedidos con datos de demostración
    this.generarPedidosDemostacion(usuario.email || 'usuario@demo.com');
  }

  /**
   * Genera pedidos de demostración para el usuario.
   * En una aplicación real, esto vendría del backend.
   * 
   * @param emailUsuario - Email del usuario para asociar los pedidos
   */
  private generarPedidosDemostacion(emailUsuario: string): void {
    const pedidosDemo: PedidoDemo[] = [
      {
        id: 'PED-001',
        paymentId: 'MP-123456789',
        estado: 'completado',
        total: 89999,
        moneda: 'ARS',
        metodoPago: 'Tarjeta de Crédito',
        items: [
          {
            id: 'PROD-001',
            nombre: 'Smartphone Samsung Galaxy A54',
            cantidad: 1,
            precio: 89999,
            subtotal: 89999
          }
        ],
        cliente: {
          email: emailUsuario,
          nombre: 'Usuario',
          apellido: 'Demo'
        },
        fechaCreacion: new Date('2025-01-10'),
        fechaAprobacion: new Date('2025-01-10')
      },
      {
        id: 'PED-002',
        paymentId: 'MP-987654321',
        estado: 'pendiente',
        total: 22000,
        moneda: 'ARS',
        metodoPago: 'Transferencia Bancaria',
        items: [
          {
            id: 'PROD-005',
            nombre: 'Zapatillas Running Adidas Ultraboost',
            cantidad: 1,
            precio: 22000,
            subtotal: 22000
          }
        ],
        cliente: {
          email: emailUsuario,
          nombre: 'Usuario',
          apellido: 'Demo'
        },
        fechaCreacion: new Date('2025-01-12')
      },
      {
        id: 'PED-003',
        paymentId: 'MP-555666777',
        estado: 'rechazado',
        total: 8500,
        moneda: 'ARS',
        metodoPago: 'Tarjeta de Débito',
        items: [
          {
            id: 'PROD-003',
            nombre: 'Remera Deportiva Nike Dri-FIT',
            cantidad: 1,
            precio: 8500,
            subtotal: 8500
          }
        ],
        cliente: {
          email: emailUsuario,
          nombre: 'Usuario',
          apellido: 'Demo'
        },
        fechaCreacion: new Date('2025-01-08'),
        motivoRechazo: 'Fondos insuficientes'
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
  verDetalles(pedido: PedidoDemo): void {
    const productosHtml = pedido.items.map(item => `
      <div class="d-flex justify-content-between mb-2">
        <span>${item.nombre} (x${item.cantidad})</span>
        <strong>$${item.subtotal.toLocaleString()}</strong>
      </div>
    `).join('');

    Swal.fire({
      title: `Detalles del Pedido #${pedido.id}`,
      html: `
        <div class="text-start">
          <h6><strong>Estado:</strong></h6>
          <p><span class="badge ${this.obtenerClaseEstado(pedido.estado)}">${this.obtenerTextoEstado(pedido.estado)}</span></p>
          
          <h6><strong>Total:</strong></h6>
          <p class="text-success fs-5"><strong>$${pedido.total.toLocaleString()}</strong></p>
          
          <h6><strong>Método de Pago:</strong></h6>
          <p>${pedido.metodoPago}</p>
          
          <h6><strong>Payment ID:</strong></h6>
          <p><code>${pedido.paymentId}</code></p>
          
          <h6><strong>Fecha de Creación:</strong></h6>
          <p>${pedido.fechaCreacion.toLocaleDateString()}</p>
          
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
  descargarFactura(pedido: PedidoDemo): void {
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
  consultarEstado(pedido: PedidoDemo): void {
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

  // --- MÉTODOS AUXILIARES ---

  /**
   * Obtiene la clase CSS apropiada para el estado del pedido.
   * 
   * @param estado - El estado del pedido
   * @returns La clase CSS correspondiente
   */
  obtenerClaseEstado(estado: string): string {
    const clases = {
      'completado': 'bg-success',
      'pendiente': 'bg-warning text-dark',
      'rechazado': 'bg-danger',
      'reembolsado': 'bg-info',
      'creado': 'bg-secondary',
      'desconocido': 'bg-secondary'
    };

    return clases[estado as keyof typeof clases] || 'bg-secondary';
  }

  /**
   * Obtiene el texto descriptivo para el estado del pedido.
   * 
   * @param estado - El estado del pedido
   * @returns El texto descriptivo correspondiente
   */
  obtenerTextoEstado(estado: string): string {
    const textos = {
      'completado': 'Completado',
      'pendiente': 'Pendiente',
      'rechazado': 'Rechazado',
      'reembolsado': 'Reembolsado',
      'creado': 'Creado',
      'desconocido': 'Desconocido'
    };

    return textos[estado as keyof typeof textos] || 'Desconocido';
  }
}
