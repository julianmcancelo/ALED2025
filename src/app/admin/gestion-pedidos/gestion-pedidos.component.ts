// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

/**
 * ============================================================================
 * COMPONENTE DE GESTIÓN DE PEDIDOS - PANEL DE ADMINISTRACIÓN
 * ============================================================================
 * 
 * Este componente permite a los administradores gestionar todos los pedidos
 * del sistema de e-commerce ALED2025. Proporciona una interfaz completa para
 * visualizar, filtrar y administrar el estado de los pedidos.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Visualización de lista completa de pedidos
 * - Filtros por estado de pedido (pendiente, completado, cancelado, etc.)
 * - Búsqueda de pedidos por ID o email del cliente
 * - Actualización de estados de pedidos
 * - Vista detallada de información de cada pedido
 * - Estadísticas básicas de pedidos
 * 
 * TECNOLOGÍAS UTILIZADAS:
 * - Angular Signals para estado reactivo
 * - Angular Reactive Forms para filtros y búsqueda
 * - SweetAlert2 para confirmaciones y notificaciones
 * - Bootstrap para diseño responsivo
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */
@Component({
  selector: 'app-gestion-pedidos',
  standalone: true, // Componente independiente para mejor tree-shaking
  imports: [
    CommonModule,              // Directivas básicas de Angular (*ngIf, *ngFor, etc.)
    FormsModule               // Para formularios de filtros y búsqueda
  ],
  template: `
    <div class="container-fluid py-4">
      <!-- Header del componente -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-box-seam me-2"></i>
                Gestión de Pedidos
              </h2>
              <p class="text-muted mb-0">
                Administra todos los pedidos del sistema
              </p>
            </div>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-outline-primary"
                (click)="cargarPedidos()"
                [disabled]="cargando()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                {{ cargando() ? 'Cargando...' : 'Actualizar' }}
              </button>
              <button 
                class="btn btn-success"
                (click)="generarPedidosPrueba()">
                <i class="bi bi-plus-circle me-1"></i>
                Generar Datos de Prueba
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tarjetas de estadísticas -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Total Pedidos</h6>
                  <h3 class="mb-0">{{ estadisticas().totalPedidos }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-box-seam fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
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
          <div class="card bg-danger text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Cancelados</h6>
                  <h3 class="mb-0">{{ estadisticas().cancelados }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-x-circle fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="row mb-4">
        <div class="col-md-6">
          <label class="form-label">Filtrar por estado:</label>
          <select 
            class="form-select"
            [(ngModel)]="filtroEstado"
            (ngModelChange)="aplicarFiltros()">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="completado">Completados</option>
            <option value="enviado">Enviados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Buscar pedido:</label>
          <input 
            type="text"
            class="form-control"
            placeholder="Buscar por ID, email del cliente..."
            [(ngModel)]="busquedaTexto"
            (ngModelChange)="aplicarFiltros()">
        </div>
      </div>

      <!-- Lista de pedidos -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-list-ul me-2"></i>
                Lista de Pedidos
                <span class="badge bg-primary ms-2">{{ pedidosFiltrados().length }}</span>
              </h5>
            </div>
            <div class="card-body">
              <!-- Estado de carga -->
              <div *ngIf="cargando()" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando pedidos...</p>
              </div>

              <!-- Sin pedidos -->
              <div *ngIf="!cargando() && pedidosFiltrados().length === 0" class="text-center py-4">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3">No hay pedidos</h4>
                <p class="text-muted">
                  No se encontraron pedidos con los filtros aplicados.
                </p>
                <button 
                  class="btn btn-primary"
                  (click)="generarPedidosPrueba()">
                  <i class="bi bi-plus-circle me-1"></i>
                  Generar Pedidos de Prueba
                </button>
              </div>

              <!-- Tabla de pedidos -->
              <div *ngIf="!cargando() && pedidosFiltrados().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>ID Pedido</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let pedido of pedidosFiltrados()">
                      <td>
                        <code>{{ pedido.id }}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{{ pedido.clienteNombre }}</strong>
                          <br>
                          <small class="text-muted">{{ pedido.clienteEmail }}</small>
                        </div>
                      </td>
                      <td>
                        <strong class="text-success">
                          {{ pedido.total | currency:'ARS':'symbol':'1.0-0' }}
                        </strong>
                      </td>
                      <td>
                        <span [class]="'badge ' + obtenerClaseEstado(pedido.estado)">
                          {{ pedido.estado | titlecase }}
                        </span>
                      </td>
                      <td>
                        <small>{{ pedido.fecha | date:'dd/MM/yyyy HH:mm' }}</small>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button 
                            class="btn btn-outline-primary"
                            (click)="verDetalles(pedido)"
                            title="Ver detalles">
                            <i class="bi bi-eye"></i>
                          </button>
                          <button 
                            class="btn btn-outline-success"
                            (click)="cambiarEstado(pedido)"
                            title="Cambiar estado">
                            <i class="bi bi-arrow-repeat"></i>
                          </button>
                          <button 
                            class="btn btn-outline-danger"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
      background-color: #f8f9fa;
    }
    
    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
    }

    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border: 1px solid rgba(0, 0, 0, 0.125);
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    }
  `]
})
export class GestionPedidosComponent implements OnInit {

  // --- PROPIEDADES DEL COMPONENTE ---

  /**
   * Signal que contiene la lista completa de pedidos.
   * Se actualiza automáticamente cuando se cargan nuevos datos.
   */
  pedidos = signal<PedidoDemo[]>([]);

  /**
   * Signal que indica si el componente está cargando datos.
   * Se usa para mostrar el spinner de carga en la interfaz.
   */
  cargando = signal<boolean>(false);

  /**
   * Filtro actual por estado de pedido.
   * Controla qué pedidos se muestran en la tabla.
   */
  filtroEstado = 'todos';

  /**
   * Texto de búsqueda actual.
   * Permite filtrar pedidos por ID o email del cliente.
   */
  busquedaTexto = '';

  // --- COMPUTED SIGNALS (Señales Computadas) ---

  /**
   * Computed Signal que filtra los pedidos según los criterios seleccionados.
   * Se recalcula automáticamente cuando cambian los filtros o los pedidos.
   */
  pedidosFiltrados = computed(() => {
    let resultado = this.pedidos();

    // Filtrar por estado si no es "todos"
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(p => p.estado === this.filtroEstado);
    }

    // Filtrar por texto de búsqueda si hay alguno
    if (this.busquedaTexto.trim()) {
      const termino = this.busquedaTexto.toLowerCase();
      resultado = resultado.filter(p => 
        p.id.toLowerCase().includes(termino) ||
        p.clienteEmail.toLowerCase().includes(termino) ||
        p.clienteNombre.toLowerCase().includes(termino)
      );
    }

    return resultado;
  });

  /**
   * Computed Signal que calcula estadísticas de los pedidos.
   * Proporciona contadores para las tarjetas de resumen.
   */
  estadisticas = computed(() => {
    const todos = this.pedidos();
    return {
      totalPedidos: todos.length,
      completados: todos.filter(p => p.estado === 'completado').length,
      pendientes: todos.filter(p => p.estado === 'pendiente').length,
      cancelados: todos.filter(p => p.estado === 'cancelado').length
    };
  });

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---

  /**
   * Método que se ejecuta automáticamente cuando el componente se inicializa.
   * Aquí cargamos los datos iniciales de pedidos.
   */
  ngOnInit(): void {
    // Cargar pedidos al inicializar el componente
    this.cargarPedidos();
  }

  // --- MÉTODOS DE GESTIÓN DE DATOS ---

  /**
   * Carga los pedidos desde la fuente de datos.
   * En este caso, simula la carga con datos de demostración.
   */
  cargarPedidos(): void {
    // --- SIMULACIÓN DE CARGA ---
    // Activamos el estado de carga
    this.cargando.set(true);

    // Simulamos una operación asíncrona (como una llamada a API)
    setTimeout(() => {
      // En una aplicación real, aquí haríamos la llamada al servicio
      // this.pedidosService.obtenerTodosLosPedidos().subscribe(...)
      
      // Por ahora, mantenemos los datos existentes o cargamos datos demo
      if (this.pedidos().length === 0) {
        this.generarPedidosPrueba();
      }
      
      // Desactivamos el estado de carga
      this.cargando.set(false);
    }, 1000);
  }

  /**
   * Genera pedidos de demostración para mostrar la funcionalidad.
   * Útil para pruebas y demostraciones del sistema.
   */
  generarPedidosPrueba(): void {
    // --- DATOS DE DEMOSTRACIÓN ---
    const pedidosDemo: PedidoDemo[] = [
      {
        id: 'PED-001',
        clienteNombre: 'Juan Pérez',
        clienteEmail: 'juan.perez@email.com',
        total: 45000,
        estado: 'completado',
        fecha: new Date('2025-01-10'),
        productos: ['Smartphone Samsung', 'Funda protectora']
      },
      {
        id: 'PED-002',
        clienteNombre: 'María González',
        clienteEmail: 'maria.gonzalez@email.com',
        total: 28500,
        estado: 'pendiente',
        fecha: new Date('2025-01-12'),
        productos: ['Auriculares Bluetooth', 'Cable USB-C']
      },
      {
        id: 'PED-003',
        clienteNombre: 'Carlos López',
        clienteEmail: 'carlos.lopez@email.com',
        total: 67200,
        estado: 'enviado',
        fecha: new Date('2025-01-11'),
        productos: ['Notebook Lenovo', 'Mouse inalámbrico']
      },
      {
        id: 'PED-004',
        clienteNombre: 'Ana Martínez',
        clienteEmail: 'ana.martinez@email.com',
        total: 15800,
        estado: 'cancelado',
        fecha: new Date('2025-01-09'),
        productos: ['Remera deportiva', 'Gorra Nike']
      },
      {
        id: 'PED-005',
        clienteNombre: 'Roberto Silva',
        clienteEmail: 'roberto.silva@email.com',
        total: 89000,
        estado: 'completado',
        fecha: new Date('2025-01-08'),
        productos: ['Smart TV LG 55"', 'Soporte de pared']
      }
    ];

    // Actualizamos el signal con los datos de demostración
    this.pedidos.set(pedidosDemo);

    // Mostramos confirmación al usuario
    Swal.fire({
      icon: 'success',
      title: '¡Datos generados!',
      text: `Se generaron ${pedidosDemo.length} pedidos de demostración`,
      timer: 2000,
      showConfirmButton: false
    });
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
    Swal.fire({
      title: `Detalles del Pedido ${pedido.id}`,
      html: `
        <div class="text-start">
          <h6><strong>Cliente:</strong></h6>
          <p>${pedido.clienteNombre}</p>
          
          <h6><strong>Email:</strong></h6>
          <p>${pedido.clienteEmail}</p>
          
          <h6><strong>Total:</strong></h6>
          <p class="text-success fs-5"><strong>$${pedido.total.toLocaleString()}</strong></p>
          
          <h6><strong>Estado:</strong></h6>
          <p><span class="badge ${this.obtenerClaseEstado(pedido.estado)}">${pedido.estado}</span></p>
          
          <h6><strong>Fecha:</strong></h6>
          <p>${pedido.fecha.toLocaleDateString()}</p>
          
          <h6><strong>Productos:</strong></h6>
          <ul>
            ${pedido.productos.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar'
    });
  }

  /**
   * Permite cambiar el estado de un pedido.
   * 
   * @param pedido - El pedido cuyo estado se va a cambiar
   */
  async cambiarEstado(pedido: PedidoDemo): Promise<void> {
    const { value: nuevoEstado } = await Swal.fire({
      title: 'Cambiar Estado del Pedido',
      text: `Pedido: ${pedido.id}`,
      input: 'select',
      inputOptions: {
        'pendiente': 'Pendiente',
        'completado': 'Completado',
        'enviado': 'Enviado',
        'cancelado': 'Cancelado'
      },
      inputValue: pedido.estado,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar'
    });

    if (nuevoEstado && nuevoEstado !== pedido.estado) {
      // --- ACTUALIZACIÓN DEL ESTADO ---
      // Actualizamos el pedido en la lista
      this.pedidos.update(pedidos => 
        pedidos.map(p => 
          p.id === pedido.id 
            ? { ...p, estado: nuevoEstado as EstadoPedido }
            : p
        )
      );

      // Confirmamos la actualización al usuario
      Swal.fire({
        icon: 'success',
        title: '¡Estado actualizado!',
        text: `El pedido ${pedido.id} ahora está ${nuevoEstado}`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  /**
   * Elimina un pedido del sistema después de confirmación.
   * 
   * @param pedido - El pedido a eliminar
   */
  async eliminarPedido(pedido: PedidoDemo): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el pedido ${pedido.id} permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      // --- ELIMINACIÓN DEL PEDIDO ---
      // Removemos el pedido de la lista
      this.pedidos.update(pedidos => 
        pedidos.filter(p => p.id !== pedido.id)
      );

      // Confirmamos la eliminación al usuario
      Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: `El pedido ${pedido.id} ha sido eliminado`,
        timer: 2000,
        showConfirmButton: false
      });
    }
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
      'pendiente': 'bg-warning text-dark',
      'completado': 'bg-success',
      'enviado': 'bg-info',
      'cancelado': 'bg-danger'
    };

    return clases[estado as keyof typeof clases] || 'bg-secondary';
  }
}

// --- INTERFACES Y TIPOS ---

/**
 * Interfaz que define la estructura de un pedido de demostración.
 * En una aplicación real, esto vendría del backend.
 */
interface PedidoDemo {
  id: string;              // ID único del pedido
  clienteNombre: string;   // Nombre del cliente
  clienteEmail: string;    // Email del cliente
  total: number;           // Total del pedido en pesos
  estado: EstadoPedido;    // Estado actual del pedido
  fecha: Date;             // Fecha de creación del pedido
  productos: string[];     // Lista de productos en el pedido
}

/**
 * Tipo que define los posibles estados de un pedido.
 */
type EstadoPedido = 'pendiente' | 'completado' | 'enviado' | 'cancelado';
