/**
 * COMPONENTE GESTIÓN DE PEDIDOS ADMIN - SISTEMA ALED2025
 * 
 * Panel administrativo para gestionar todos los pedidos del sistema.
 * Permite ver, filtrar y cambiar estados de pedidos.
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Servicios
import { AuthService } from '../../auth/auth';
import { PedidosService } from '../../servicios/pedidos.service';

// Modelos
import { Pedido, EstadoPedido } from '../../shared/models/pedido.model';

@Component({
  selector: 'app-gestion-pedidos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-box-seam me-2"></i>
                Gestión de Pedidos
              </h2>
              <p class="text-muted mb-0">
                Panel administrativo para gestionar todos los pedidos del sistema
              </p>
            </div>
            <div>
              <button 
                class="btn btn-outline-primary"
                (click)="cargarTodosPedidos()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-4">
        <div class="col-md-2">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <h4 class="mb-0">{{ estadisticas().total }}</h4>
              <small>Total Pedidos</small>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card bg-warning text-dark">
            <div class="card-body text-center">
              <h4 class="mb-0">{{ estadisticas().pendientes }}</h4>
              <small>Pendientes</small>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card bg-info text-white">
            <div class="card-body text-center">
              <h4 class="mb-0">{{ estadisticas().preparando }}</h4>
              <small>Preparando</small>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card bg-secondary text-white">
            <div class="card-body text-center">
              <h4 class="mb-0">{{ estadisticas().enviados }}</h4>
              <small>Enviados</small>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card bg-success text-white">
            <div class="card-body text-center">
              <h4 class="mb-0">{{ estadisticas().entregados }}</h4>
              <small>Entregados</small>
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="card bg-danger text-white">
            <div class="card-body text-center">
              <h4 class="mb-0">{{ estadisticas().rechazados }}</h4>
              <small>Rechazados</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="row mb-4">
        <div class="col-md-4">
          <label class="form-label">Filtrar por estado:</label>
          <select 
            class="form-select"
            [(ngModel)]="filtroEstado"
            (ngModelChange)="aplicarFiltros()">
            <option value="todos">Todos los estados</option>
            <option value="creado">Creados</option>
            <option value="pendiente">Pendientes</option>
            <option value="pagado">Pagados</option>
            <option value="preparando">Preparando</option>
            <option value="enviado">Enviados</option>
            <option value="entregado">Entregados</option>
            <option value="cancelado">Cancelados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      <!-- Lista de pedidos -->
      <div class="row">
        <div class="col-12">
          <div *ngIf="pedidosFiltrados().length === 0" class="text-center py-5">
            <i class="bi bi-inbox display-1 text-muted"></i>
            <h4 class="mt-3">No hay pedidos</h4>
            <p class="text-muted">No se encontraron pedidos con los filtros aplicados.</p>
          </div>

          <div *ngIf="pedidosFiltrados().length > 0" class="table-responsive">
            <table class="table table-hover">
              <thead class="table-dark">
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pedido of pedidosFiltrados()">
                  <td>
                    <strong>#{{ pedido.numeroPedido }}</strong>
                    <br>
                    <small class="text-muted">{{ pedido.items.length }} items</small>
                  </td>
                  <td>
                    <strong>{{ pedido.cliente.nombre }} {{ pedido.cliente.apellido }}</strong>
                    <br>
                    <small class="text-muted">{{ pedido.cliente.email }}</small>
                  </td>
                  <td>
                    <span [class]="'badge ' + obtenerClaseEstado(pedido.estado)">
                      {{ obtenerTextoEstado(pedido.estado) }}
                    </span>
                  </td>
                  <td>
                    <strong>{{ pedido.total | currency:'ARS':'symbol':'1.0-0' }}</strong>
                  </td>
                  <td>
                    {{ pedido.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-primary"
                        (click)="verDetallesPedido(pedido)"
                        title="Ver detalles">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button 
                        class="btn btn-outline-success"
                        (click)="cambiarEstadoPedido(pedido)"
                        title="Cambiar estado"
                        [disabled]="pedido.estado === 'entregado' || pedido.estado === 'cancelado'">
                        <i class="bi bi-arrow-right-circle"></i>
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
  `,
  styles: [`
    .card {
      transition: transform 0.2s;
    }
    
    .card:hover {
      transform: translateY(-2px);
    }
    
    .table th {
      border-top: none;
    }
    
    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
    }
  `]
})
export class GestionPedidosAdminComponent implements OnInit {
  
  // --- SERVICIOS ---
  private authService = inject(AuthService);
  private pedidosService = inject(PedidosService);
  private router = inject(Router);
  
  // --- SEÑALES ---
  pedidos = signal<Pedido[]>([]);
  filtroEstado = 'todos';
  
  // --- COMPUTED SIGNALS ---
  pedidosFiltrados = computed(() => {
    const todos = this.pedidos();
    
    if (this.filtroEstado === 'todos') {
      return todos;
    }
    
    return todos.filter(pedido => pedido.estado === this.filtroEstado);
  });
  
  estadisticas = computed(() => {
    const todos = this.pedidos();
    
    return {
      total: todos.length,
      pendientes: todos.filter(p => p.estado === 'pendiente').length,
      preparando: todos.filter(p => p.estado === 'preparando').length,
      enviados: todos.filter(p => p.estado === 'enviado').length,
      entregados: todos.filter(p => p.estado === 'entregado').length,
      rechazados: todos.filter(p => p.estado === 'rechazado' || p.estado === 'cancelado').length
    };
  });
  
  // --- MÉTODOS ---
  
  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarTodosPedidos();
  }
  
  private verificarPermisos(): void {
    const usuario = this.authService.currentUserSignal();
    
    if (!usuario || usuario.rol !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para acceder a esta sección'
      }).then(() => {
        this.router.navigate(['/']);
      });
    }
  }
  
  async cargarTodosPedidos(): Promise<void> {
    try {
      console.log('🔄 Cargando todos los pedidos...');
      
      // Por ahora, como no tenemos un método para obtener todos los pedidos,
      // vamos a simular con datos demo
      this.generarPedidosDemo();
      
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los pedidos'
      });
    }
  }
  
  private generarPedidosDemo(): void {
    // Generar algunos pedidos demo para mostrar la funcionalidad
    const pedidosDemo: Pedido[] = [
      {
        id: 'admin-demo-1',
        numeroPedido: 'ALED-240115-X1Y2',
        usuarioId: 'user-1',
        cliente: {
          nombre: 'María',
          apellido: 'González',
          email: 'maria@example.com',
          telefono: '123456789'
        },
        estado: 'pagado',
        items: [
          {
            id: 'item-1',
            productoId: 'prod-1',
            nombre: 'Smartphone Samsung Galaxy',
            precioUnitario: 85000,
            cantidad: 1,
            subtotal: 85000
          }
        ],
        envio: {
          direccion: 'Av. Rivadavia 1234',
          ciudad: 'Buenos Aires',
          codigoPostal: '1000',
          provincia: 'CABA',
          pais: 'Argentina',
          costoEnvio: 2500,
          metodoEnvio: 'Envío estándar'
        },
        pago: {
          metodoPago: 'tarjeta_virtual',
          estadoPago: 'aprobado',
          montoPagado: 87500,
          moneda: 'ARS'
        },
        subtotal: 85000,
        totalDescuentos: 0,
        costoEnvio: 2500,
        total: 87500,
        fechaCreacion: new Date('2025-01-15'),
        fechaActualizacion: new Date('2025-01-15'),
        historialEstados: [
          {
            estadoNuevo: 'creado',
            fecha: new Date('2025-01-15'),
            motivo: 'Pedido creado'
          },
          {
            estadoAnterior: 'creado',
            estadoNuevo: 'pagado',
            fecha: new Date('2025-01-15'),
            motivo: 'Pago confirmado'
          }
        ]
      },
      {
        id: 'admin-demo-2',
        numeroPedido: 'ALED-240114-Z3W4',
        usuarioId: 'user-2',
        cliente: {
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          email: 'carlos@example.com',
          telefono: '987654321'
        },
        estado: 'preparando',
        items: [
          {
            id: 'item-2',
            productoId: 'prod-2',
            nombre: 'Notebook Lenovo',
            precioUnitario: 120000,
            cantidad: 1,
            subtotal: 120000
          }
        ],
        envio: {
          direccion: 'San Martín 567',
          ciudad: 'Córdoba',
          codigoPostal: '5000',
          provincia: 'Córdoba',
          pais: 'Argentina',
          costoEnvio: 3500,
          metodoEnvio: 'Envío express'
        },
        pago: {
          metodoPago: 'tarjeta_virtual',
          estadoPago: 'aprobado',
          montoPagado: 123500,
          moneda: 'ARS'
        },
        subtotal: 120000,
        totalDescuentos: 0,
        costoEnvio: 3500,
        total: 123500,
        fechaCreacion: new Date('2025-01-14'),
        fechaActualizacion: new Date('2025-01-14'),
        historialEstados: [
          {
            estadoNuevo: 'creado',
            fecha: new Date('2025-01-14'),
            motivo: 'Pedido creado'
          },
          {
            estadoAnterior: 'pagado',
            estadoNuevo: 'preparando',
            fecha: new Date('2025-01-14'),
            motivo: 'Pedido en preparación'
          }
        ]
      }
    ];
    
    this.pedidos.set(pedidosDemo);
  }
  
  aplicarFiltros(): void {
    // Los computed signals se actualizan automáticamente
  }
  
  verDetallesPedido(pedido: Pedido): void {
    const productosHtml = pedido.items.map(item => `
      <div class="d-flex justify-content-between mb-2">
        <span>${item.nombre} (x${item.cantidad})</span>
        <strong>$${item.subtotal.toLocaleString()}</strong>
      </div>
    `).join('');

    Swal.fire({
      title: `Pedido #${pedido.numeroPedido}`,
      html: `
        <div class="text-start">
          <h6><strong>Cliente:</strong></h6>
          <p>${pedido.cliente.nombre} ${pedido.cliente.apellido}<br>
          ${pedido.cliente.email}</p>
          
          <h6><strong>Estado:</strong></h6>
          <p><span class="badge ${this.obtenerClaseEstado(pedido.estado)}">${this.obtenerTextoEstado(pedido.estado)}</span></p>
          
          <h6><strong>Dirección de Envío:</strong></h6>
          <p>${pedido.envio.direccion}<br>
          ${pedido.envio.ciudad}, ${pedido.envio.provincia}</p>
          
          <h6><strong>Productos:</strong></h6>
          <div class="border rounded p-2">
            ${productosHtml}
          </div>
          
          <h6><strong>Total:</strong></h6>
          <p class="text-success fs-5"><strong>$${pedido.total.toLocaleString()}</strong></p>
        </div>
      `,
      width: 600,
      confirmButtonText: 'Cerrar'
    });
  }
  
  cambiarEstadoPedido(pedido: Pedido): void {
    const estadosSiguientes = this.obtenerEstadosSiguientes(pedido.estado);
    
    if (estadosSiguientes.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios disponibles',
        text: 'Este pedido ya está en su estado final.'
      });
      return;
    }
    
    const opciones = estadosSiguientes.map(estado => 
      `<option value="${estado}">${this.obtenerTextoEstado(estado)}</option>`
    ).join('');
    
    Swal.fire({
      title: `Cambiar Estado - Pedido #${pedido.numeroPedido}`,
      html: `
        <div class="text-start">
          <p><strong>Estado actual:</strong> ${this.obtenerTextoEstado(pedido.estado)}</p>
          <label class="form-label">Nuevo estado:</label>
          <select id="nuevoEstado" class="form-select">
            ${opciones}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Cambiar Estado',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const select = document.getElementById('nuevoEstado') as HTMLSelectElement;
        return select.value;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const nuevoEstado = result.value as EstadoPedido;
        await this.actualizarEstadoPedido(pedido, nuevoEstado);
      }
    });
  }
  
  private async actualizarEstadoPedido(pedido: Pedido, nuevoEstado: EstadoPedido): Promise<void> {
    try {
      // Simular actualización (en una app real usaríamos el servicio)
      const pedidosActuales = this.pedidos();
      const pedidoIndex = pedidosActuales.findIndex(p => p.id === pedido.id);
      
      if (pedidoIndex !== -1) {
        pedidosActuales[pedidoIndex] = {
          ...pedido,
          estado: nuevoEstado,
          fechaActualizacion: new Date(),
          historialEstados: [
            ...pedido.historialEstados,
            {
              estadoAnterior: pedido.estado,
              estadoNuevo: nuevoEstado,
              fecha: new Date(),
              motivo: 'Actualizado por administrador'
            }
          ]
        };
        
        this.pedidos.set([...pedidosActuales]);
        
        Swal.fire({
          icon: 'success',
          title: 'Estado Actualizado',
          text: `El pedido #${pedido.numeroPedido} ahora está en estado: ${this.obtenerTextoEstado(nuevoEstado)}`,
          timer: 2000,
          showConfirmButton: false
        });
      }
      
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el estado del pedido'
      });
    }
  }
  
  private obtenerEstadosSiguientes(estadoActual: EstadoPedido): EstadoPedido[] {
    const flujoEstados: { [key in EstadoPedido]: EstadoPedido[] } = {
      'creado': ['pendiente', 'cancelado'],
      'pendiente': ['pagado', 'rechazado'],
      'pagado': ['preparando', 'reembolsado'],
      'preparando': ['enviado'],
      'enviado': ['entregado'],
      'entregado': [],
      'cancelado': [],
      'rechazado': [],
      'reembolsado': []
    };
    
    return flujoEstados[estadoActual] || [];
  }
  
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
}
