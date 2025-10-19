// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

// Importaciones de servicios del proyecto
import { AuthService } from '../auth/auth';
import { PedidosService } from '../servicios/pedidos.service';
import { ConfiguracionService } from '../servicios/configuracion';

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
    <div class="container-fluid" style="background-color: #f5f5f5; min-height: 100vh; padding: 20px 0;">
      <div class="container">
        <!-- Header del componente -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h3 class="mb-0 fw-bold">
                  Mis compras
                </h3>
              </div>
              <div>
                <button 
                  class="btn btn-sm btn-outline-secondary"
                  (click)="cargarPedidos()">
                  <i class="bi bi-arrow-clockwise me-1"></i>
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="row mb-3">
          <div class="col-md-4">
            <select 
              class="form-select"
              [(ngModel)]="filtroEstado"
              (ngModelChange)="aplicarFiltros()">
              <option value="todos">Todos</option>
              <option value="entregado">Entregados</option>
              <option value="pendiente">Pendientes</option>
              <option value="rechazado">Rechazados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>

        <!-- Sin pedidos -->
        <div *ngIf="pedidosFiltrados().length === 0" class="text-center py-5">
          <div class="card shadow-sm">
            <div class="card-body py-5">
              <i class="bi bi-bag-x display-1 text-muted"></i>
              <h4 class="mt-3">No tienes compras</h4>
              <p class="text-muted">Aún no has realizado ninguna compra.</p>
              <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-primary" (click)="irATienda()">
                  <i class="bi bi-shop me-1"></i>
                  Ir a la Tienda
                </button>
                <button class="btn btn-outline-secondary" (click)="generarDatosDemo()">
                  <i class="bi bi-gear me-1"></i>
                  Datos Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de pedidos -->
        <div *ngIf="pedidosFiltrados().length > 0">
          <!-- Agrupar por fecha -->
          <ng-container *ngFor="let grupo of pedidosAgrupadosPorFecha()">
            <!-- Fecha separadora -->
            <div class="fecha-separador mb-3">
              <small class="text-muted">{{ grupo.fecha }}</small>
            </div>

            <!-- Pedidos de esa fecha -->
            <ng-container *ngFor="let pedido of grupo.pedidos">
              <!-- Card por cada item del pedido -->
              <div class="pedido-card mb-3" *ngFor="let item of pedido.items">
                <div class="card shadow-sm">
                  <div class="card-body p-3">
                    <div class="row align-items-center">
                      <!-- Imagen del producto -->
                      <div class="col-auto">
                        <div class="producto-imagen-thumbnail">
                          <img *ngIf="item.imagen" [src]="item.imagen" [alt]="item.nombre">
                          <div *ngIf="!item.imagen" class="placeholder-thumbnail">
                            <i class="bi bi-box-seam"></i>
                          </div>
                        </div>
                      </div>

                      <!-- Info del producto -->
                      <div class="col">
                        <!-- Estado -->
                        <div class="mb-2">
                          <span [class]="'estado-badge ' + obtenerClaseEstadoML(pedido.estado)">
                            {{ obtenerTextoEstadoML(pedido.estado) }}
                          </span>
                        </div>

                        <!-- Título -->
                        <h6 class="mb-1 fw-bold">{{ obtenerTituloPedido(pedido) }}</h6>

                        <!-- Descripción del producto -->
                        <p class="text-muted mb-1 small">{{ item.nombre }}</p>
                        <p class="text-muted mb-1 small">{{ item.cantidad }} unidad<span *ngIf="item.cantidad > 1">es</span></p>

                        <!-- Info tienda -->
                        <div class="tienda-info">
                          <small class="text-muted">
                            <i class="bi bi-shop me-1"></i>
                            Tienda {{ configuracion().titulo || 'ALED' }}
                            <i class="bi bi-patch-check-fill text-primary ms-1"></i>
                          </small>
                        </div>

                        <!-- Mensajes adicionales -->
                        <div *ngIf="pedido.pago.motivoRechazo" class="mt-2">
                          <small class="text-danger">
                            <i class="bi bi-exclamation-circle me-1"></i>
                            {{ pedido.pago.motivoRechazo }}
                          </small>
                        </div>
                      </div>

                      <!-- Botones de acción -->
                      <div class="col-auto">
                        <div class="d-flex flex-column gap-2">
                          <button class="btn btn-primary btn-sm" (click)="verDetalles(pedido)">
                            Ver compra
                          </button>
                          <button class="btn btn-outline-primary btn-sm" (click)="volverAComprar(item)">
                            Volver a comprar
                          </button>
                          <button *ngIf="pedido.estado === 'rechazado' || pedido.estado === 'cancelado'" 
                                  class="btn btn-link btn-sm text-primary p-0"
                                  (click)="verDetalles(pedido)">
                            <small>Enviar mensaje</small>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fecha-separador {
      padding: 8px 0;
      font-weight: 500;
    }

    .pedido-card .card {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      transition: box-shadow 0.2s;
      background: white;
    }

    .pedido-card .card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .producto-imagen-thumbnail {
      width: 80px;
      height: 80px;
      border-radius: 6px;
      overflow: hidden;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .producto-imagen-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-thumbnail {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 2rem;
    }

    .estado-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .estado-badge.estado-cancelado {
      background-color: #fff4e6;
      color: #d97706;
    }

    .estado-badge.estado-rechazado {
      background-color: #fee;
      color: #dc2626;
    }

    .estado-badge.estado-reembolso {
      background-color: #e6f7ff;
      color: #1890ff;
    }

    .estado-badge.estado-entregado {
      background-color: #f0fdf4;
      color: #16a34a;
    }

    .estado-badge.estado-pendiente {
      background-color: #fff4e6;
      color: #d97706;
    }

    .tienda-info {
      margin-top: 8px;
    }

    .btn-sm {
      font-size: 0.875rem;
      padding: 0.375rem 0.75rem;
      white-space: nowrap;
    }

    .btn-link {
      text-decoration: none;
    }

    .btn-link:hover {
      text-decoration: underline;
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

  /**
   * ConfiguracionService: Servicio para obtener configuración de la aplicación
   */
  private configuracionService = inject(ConfiguracionService);

  /**
   * Signal de configuración
   */
  protected configuracion = this.configuracionService.configuracionSignal;

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

  /**
   * Computed Signal que agrupa pedidos por fecha
   */
  pedidosAgrupadosPorFecha = computed(() => {
    const pedidos = this.pedidosFiltrados();
    const grupos: { fecha: string, pedidos: Pedido[] }[] = [];
    
    pedidos.forEach(pedido => {
      const fecha = this.formatearFechaGrupo(pedido.fechaCreacion);
      let grupo = grupos.find(g => g.fecha === fecha);
      
      if (!grupo) {
        grupo = { fecha, pedidos: [] };
        grupos.push(grupo);
      }
      
      grupo.pedidos.push(pedido);
    });
    
    return grupos;
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
      <div style="display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #333; margin-bottom: 4px;">${item.nombre}</div>
          <div style="color: #666; font-size: 14px;">Cantidad: ${item.cantidad}</div>
        </div>
        <div style="text-align: right; font-weight: 600; color: #333;">
          $${item.subtotal.toLocaleString('es-AR')}
        </div>
      </div>
    `).join('');

    const estadoBadge = this.obtenerClaseEstadoML(pedido.estado);
    let estadoColor = '#ffc107';
    if (estadoBadge.includes('entregado')) estadoColor = '#4caf50';
    if (estadoBadge.includes('rechazado')) estadoColor = '#f44336';
    if (estadoBadge.includes('cancelado')) estadoColor = '#ff9800';

    Swal.fire({
      title: '',
      html: `
        <div style="text-align: left;">
          <!-- Header con estado -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      padding: 24px; 
                      margin: -16px -16px 24px -16px; 
                      border-radius: 8px 8px 0 0;
                      color: white;">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Pedido #${pedido.numeroPedido}</div>
            <h3 style="margin: 0; font-size: 24px; font-weight: 600;">${this.obtenerTituloPedido(pedido)}</h3>
            <div style="margin-top: 12px; display: inline-block; 
                        background: rgba(255,255,255,0.2); 
                        padding: 4px 12px; 
                        border-radius: 12px;
                        font-size: 13px;">
              ${this.obtenerTextoEstadoML(pedido.estado)}
            </div>
          </div>

          <!-- Total destacado -->
          <div style="background: #f8f9fa; 
                      padding: 16px; 
                      border-radius: 8px; 
                      margin-bottom: 24px;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;">
            <span style="color: #666; font-size: 14px;">Total pagado</span>
            <span style="color: #00a650; font-size: 28px; font-weight: 700;">
              $${pedido.total.toLocaleString('es-AR')}
            </span>
          </div>

          <!-- Productos -->
          <div style="margin-bottom: 24px;">
            <h6 style="color: #666; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-transform: uppercase;">
              Productos comprados
            </h6>
            <div style="background: white; border-radius: 8px;">
              ${productosHtml}
            </div>
          </div>

          <!-- Información de pago -->
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666; font-size: 14px;">Método de pago</span>
              <span style="color: #333; font-weight: 500; font-size: 14px;">${pedido.pago.metodoPago}</span>
            </div>
            ${pedido.pago.fechaPago ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666; font-size: 14px;">Fecha de pago</span>
                <span style="color: #333; font-size: 14px;">${new Date(pedido.pago.fechaPago).toLocaleDateString('es-AR')}</span>
              </div>
            ` : ''}
            ${pedido.pago.transaccionId ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666; font-size: 14px;">ID de transacción</span>
                <span style="color: #333; font-size: 14px; font-family: monospace;">${pedido.pago.transaccionId}</span>
              </div>
            ` : ''}
          </div>

          <!-- Información de envío -->
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #666; font-size: 14px;">Dirección de entrega</span>
            </div>
            <div style="color: #333; font-size: 14px; line-height: 1.5;">
              ${pedido.envio.direccion}<br>
              ${pedido.envio.ciudad}, ${pedido.envio.provincia}<br>
              CP: ${pedido.envio.codigoPostal}
            </div>
          </div>

          ${pedido.pago.motivoRechazo ? `
            <div style="background: #fff3cd; 
                        border-left: 4px solid #ffc107; 
                        padding: 12px 16px; 
                        margin-top: 16px;
                        border-radius: 4px;">
              <div style="font-weight: 600; color: #856404; margin-bottom: 4px;">
                <i class="bi bi-exclamation-triangle me-2"></i>Motivo del rechazo
              </div>
              <div style="color: #856404; font-size: 14px;">
                ${pedido.pago.motivoRechazo}
              </div>
            </div>
          ` : ''}
        </div>
      `,
      width: 600,
      padding: '16px',
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6',
      customClass: {
        popup: 'swal-popup-custom',
        htmlContainer: 'swal-html-custom'
      }
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

  /**
   * Formatea la fecha para agrupar pedidos
   */
  formatearFechaGrupo(fecha: any): string {
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    }
    if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }

    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${date.getDate()} de ${meses[date.getMonth()]}`;
  }

  /**
   * Obtiene la clase CSS para el estado estilo Mercado Libre
   */
  obtenerClaseEstadoML(estado: EstadoPedido): string {
    const clases = {
      'cancelado': 'estado-cancelado',
      'rechazado': 'estado-rechazado',
      'reembolsado': 'estado-reembolso',
      'entregado': 'estado-entregado',
      'pendiente': 'estado-pendiente',
      'pagado': 'estado-entregado',
      'preparando': 'estado-pendiente',
      'enviado': 'estado-pendiente',
      'creado': 'estado-pendiente'
    };
    return clases[estado] || 'estado-pendiente';
  }

  /**
   * Obtiene el texto del estado estilo Mercado Libre
   */
  obtenerTextoEstadoML(estado: EstadoPedido): string {
    const textos = {
      'cancelado': 'Cancelaste la compra',
      'rechazado': 'Pago rechazado',
      'reembolsado': 'Te reembolsamos el dinero en Mercado Pago',
      'entregado': 'Entregado',
      'pendiente': 'Pendiente de pago',
      'pagado': 'Pago aprobado',
      'preparando': 'Preparando envío',
      'enviado': 'En camino',
      'creado': 'Pendiente'
    };
    return textos[estado] || 'En proceso';
  }

  /**
   * Obtiene el título del pedido
   */
  obtenerTituloPedido(pedido: Pedido): string {
    if (pedido.estado === 'cancelado') {
      return 'Cancelaste la compra';
    }
    if (pedido.estado === 'rechazado') {
      return 'Tu tarjeta rechazó el pago';
    }
    if (pedido.estado === 'reembolsado') {
      return 'Te reembolsamos el dinero en Mercado Pago';
    }
    if (pedido.estado === 'entregado') {
      return 'Entregado';
    }
    return 'En proceso';
  }

  /**
   * Acción para volver a comprar un producto
   */
  volverAComprar(item: any): void {
    Swal.fire({
      icon: 'info',
      title: 'Volver a comprar',
      text: `¿Deseas agregar "${item.nombre}" al carrito?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí irías a la página del producto o lo agregarías al carrito
        this.router.navigate(['/productos']);
      }
    });
  }
}
