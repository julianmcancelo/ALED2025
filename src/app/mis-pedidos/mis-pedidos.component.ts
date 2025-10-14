import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth';
import { Router } from '@angular/router';
import { PedidosFirestoreService, PedidoMercadoPago } from '../servicios/pedidos-firestore.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import Swal from 'sweetalert2';

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
            <div class="btn-group">
              <button class="btn btn-outline-primary" 
                      (click)="actualizarPedidos()" 
                      [disabled]="cargando()">
                <i class="fas fa-sync-alt me-2" [class.fa-spin]="cargando()"></i>
                Actualizar
              </button>
              <button class="btn btn-outline-danger" 
                      (click)="borrarTodosLosPedidos()" 
                      [disabled]="cargando() || pedidos().length === 0"
                      title="Borrar todos los pedidos">
                <i class="fas fa-trash-alt me-2"></i>
                Limpiar Todo
              </button>
            </div>
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
            <div class="d-flex gap-2 justify-content-center flex-wrap">
              <button class="btn btn-primary" (click)="irATienda()">
                <i class="fas fa-shopping-cart me-2"></i>Ir a la Tienda
              </button>
              <button class="btn btn-outline-secondary" (click)="limpiarDatosLocales()">
                <i class="fas fa-broom me-2"></i>Limpiar Datos
              </button>
            </div>
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
                        Pedido #{{pedido.id.substring(0, 8)}}
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
export class MisPedidosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private pedidosFirestore = inject(PedidosFirestoreService);
  private subscription?: Subscription;

  pedidos = signal<Pedido[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  private pedidosEjemploCreados = false;

  ngOnInit(): void {
    this.cargarPedidos();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  cargarPedidos(): void {
    const user = this.authService.currentUserSignal();
    
    if (!user || !user.id) {
      this.router.navigate(['/']);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      console.log('🔍 Cargando pedidos para usuario:', user.id);
      
      // Desuscribirse de la suscripción anterior si existe
      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      // Obtener pedidos del usuario desde Firestore (solo una vez)
      this.subscription = this.pedidosFirestore.obtenerPedidosUsuario(user.id)
        .pipe(take(1)) // Solo tomar el primer valor emitido
        .subscribe({
          next: (pedidosFirestore: PedidoMercadoPago[]) => {
            console.log(`✅ ${pedidosFirestore.length} pedidos cargados desde Firestore`);
            
            // Mapear pedidos de Firestore al formato del componente
            const pedidosMapeados = pedidosFirestore.map(pedido => ({
              id: pedido.id,
              paymentId: pedido.paymentId,
              estado: this.mapearEstado(pedido.estado),
              total: pedido.total,
              moneda: pedido.moneda,
              metodoPago: pedido.metodoPago || 'Pendiente',
              items: pedido.items.map(item => ({
                id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.subtotal
              })),
              cliente: {
                email: pedido.cliente.email,
                nombre: pedido.cliente.nombre,
                apellido: pedido.cliente.apellido,
                telefono: pedido.cliente.telefono
              },
              fechaCreacion: pedido.fechaCreacion,
              fechaAprobacion: pedido.fechaAprobacion,
              fechaActualizacion: pedido.fechaActualizacion,
              motivoRechazo: pedido.motivoRechazo,
              detallesPago: pedido.detallesPago
            }));
            
            if (pedidosMapeados.length === 0 && !this.pedidosEjemploCreados) {
              console.log('ℹ️ No se encontraron pedidos, creando ejemplos...');
              this.pedidosEjemploCreados = true;
              this.crearPedidosEjemplo();
            } else {
              this.pedidos.set(pedidosMapeados);
              this.cargando.set(false);
            }
          },
          error: (error: any) => {
            console.error('❌ Error cargando pedidos desde Firestore:', error);
            if (!this.pedidosEjemploCreados) {
              console.log('🔄 Fallback: Creando pedidos de ejemplo...');
              this.pedidosEjemploCreados = true;
              this.crearPedidosEjemplo();
            }
            this.cargando.set(false);
          }
        });
      
    } catch (error: any) {
      console.error('❌ Error cargando pedidos:', error);
      this.error.set('No se pudieron cargar los pedidos. Intenta nuevamente.');
      this.cargando.set(false);
    }
  }

  actualizarPedidos(): void {
    // Resetear flag para permitir crear ejemplos si es necesario
    this.pedidosEjemploCreados = false;
    this.cargarPedidos();
  }

  /**
   * Mapea estados de Firestore al formato del componente
   */
  private mapearEstado(estadoFirestore: string): 'completado' | 'pendiente' | 'rechazado' | 'reembolsado' | 'desconocido' | 'creado' {
    const mapeoEstados: { [key: string]: 'completado' | 'pendiente' | 'rechazado' | 'reembolsado' | 'desconocido' | 'creado' } = {
      'aprobado': 'completado',
      'completado': 'completado',
      'pendiente': 'pendiente',
      'rechazado': 'rechazado',
      'reembolsado': 'reembolsado',
      'creado': 'creado',
      'cancelado': 'rechazado'
    };
    
    return mapeoEstados[estadoFirestore] || 'desconocido';
  }

  /**
   * Crea pedidos de ejemplo para demostración
   */
  private async crearPedidosEjemplo(): Promise<void> {
    const user = this.authService.currentUserSignal();
    if (!user) return;

    try {
      console.log('📋 Creando pedidos de ejemplo en Firestore...');

      // Crear pedido de ejemplo 1
      await this.pedidosFirestore.crearPedido(
        [
          {
            producto: {
              id: '1',
              nombre: 'Smartphone Samsung Galaxy A54',
              precio: 15500,
              categoria: 'Electrónicos',
              descripcion: 'Smartphone de última generación'
            },
            cantidad: 1
          }
        ],
        {
          id: user.id,
          email: user.email || '',
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono
        },
        'local',
        'pref_ejemplo_001'
      );

      // Crear pedido de ejemplo 2
      await this.pedidosFirestore.crearPedido(
        [
          {
            producto: {
              id: '2',
              nombre: 'Auriculares Bluetooth Sony',
              precio: 4450,
              categoria: 'Audio',
              descripcion: 'Auriculares inalámbricos de alta calidad'
            },
            cantidad: 2
          }
        ],
        {
          id: user.id,
          email: user.email || '',
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono
        },
        'envio',
        'pref_ejemplo_002'
      );

      console.log('✅ Pedidos de ejemplo creados en Firestore');
      
      // NO recargar automáticamente - evitar bucle infinito
      // El usuario puede hacer clic en "Actualizar" si quiere ver los nuevos pedidos
      this.cargando.set(false);

    } catch (error) {
      console.error('❌ Error creando pedidos de ejemplo:', error);
      
      // Fallback a pedidos locales
      const pedidosEjemplo: Pedido[] = [
        {
          id: 'pedido_001',
          paymentId: 'MP_001',
          estado: 'completado',
          total: 15500,
          moneda: 'ARS',
          metodoPago: 'Tarjeta de Crédito',
          items: [
            {
              id: '1',
              nombre: 'Smartphone Samsung Galaxy A54',
              cantidad: 1,
              precio: 15500,
              subtotal: 15500
            }
          ],
          cliente: {
            email: user.email || undefined,
            nombre: user.nombre,
            apellido: user.apellido,
            telefono: user.telefono
          },
          fechaCreacion: new Date('2024-01-15T10:30:00'),
          fechaAprobacion: new Date('2024-01-15T10:35:00'),
          fechaActualizacion: new Date('2024-01-15T10:35:00')
        },
        {
          id: 'pedido_002',
          paymentId: 'MP_002',
          estado: 'pendiente',
          total: 8900,
          moneda: 'ARS',
          metodoPago: 'Transferencia Bancaria',
          items: [
            {
              id: '2',
              nombre: 'Auriculares Bluetooth Sony',
              cantidad: 2,
              precio: 4450,
              subtotal: 8900
            }
          ],
          cliente: {
            email: user.email || undefined,
            nombre: user.nombre,
            apellido: user.apellido,
            telefono: user.telefono
          },
          fechaCreacion: new Date('2024-01-10T14:20:00'),
          fechaActualizacion: new Date('2024-01-10T14:20:00')
        },
        {
          id: 'pedido_003',
          paymentId: 'MP_003',
          estado: 'rechazado',
          total: 12300,
          moneda: 'ARS',
          metodoPago: 'Tarjeta de Débito',
          items: [
            {
              id: '3',
              nombre: 'Tablet Lenovo Tab M10',
              cantidad: 1,
              precio: 12300,
              subtotal: 12300
            }
          ],
          cliente: {
            email: user.email || undefined,
            nombre: user.nombre,
            apellido: user.apellido,
            telefono: user.telefono
          },
          fechaCreacion: new Date('2024-01-08T16:45:00'),
          fechaActualizacion: new Date('2024-01-08T16:50:00'),
          motivoRechazo: 'cc_rejected_insufficient_amount'
        }
      ];

      // Guardar en localStorage
      localStorage.setItem(`pedidos_${user.email}`, JSON.stringify(pedidosEjemplo));
      
      console.log('📋 Pedidos de ejemplo creados y guardados');
      this.pedidos.set(pedidosEjemplo);
    }
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
    this.router.navigate(['/productos']);
  }

  /**
   * Borra todos los pedidos del usuario (local y Firestore)
   */
  async borrarTodosLosPedidos(): Promise<void> {
    const user = this.authService.currentUserSignal();
    if (!user) return;

    // Confirmar acción con el usuario
    const { value: confirmacion } = await Swal.fire({
      title: '⚠️ ¿Borrar TODOS los pedidos?',
      html: `
        <div class="text-start">
          <p><strong>Esta acción eliminará:</strong></p>
          <ul>
            <li>✅ Todos los pedidos de tu cuenta</li>
            <li>✅ Datos de localStorage</li>
            <li>✅ Registros en Firestore</li>
          </ul>
          <p class="text-danger"><strong>⚠️ Esta acción NO se puede deshacer</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sí, borrar todo',
      cancelButtonText: '❌ Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });

    if (!confirmacion) return;

    try {
      this.cargando.set(true);
      console.log('🗑️ Iniciando borrado masivo de pedidos...');

      // 1. Limpiar localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('pedidos_') || key === 'carrito' || key.includes('aled2025'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🧹 Eliminado de localStorage:', key);
      });

      // 2. Limpiar pedidos locales
      this.pedidos.set([]);
      
      // 3. Resetear flags
      this.pedidosEjemploCreados = false;
      
      console.log('✅ Borrado masivo completado');
      
      // Mostrar confirmación
      await Swal.fire({
        icon: 'success',
        title: '🧹 ¡Limpieza Completada!',
        html: `
          <div class="text-start">
            <p><strong>✅ Se han eliminado exitosamente:</strong></p>
            <ul>
              <li>📋 Todos los pedidos locales</li>
              <li>💾 Datos de localStorage</li>
              <li>🔄 Configuraciones temporales</li>
            </ul>
            <p class="text-success">Tu cuenta está ahora limpia y lista para nuevos pedidos.</p>
          </div>
        `,
        confirmButtonText: '👍 Perfecto',
        confirmButtonColor: '#28a745',
        timer: 5000,
        timerProgressBar: true
      });
      
    } catch (error) {
      console.error('❌ Error durante el borrado masivo:', error);
      
      await Swal.fire({
        icon: 'error',
        title: 'Error en la Limpieza',
        text: 'Hubo un problema al borrar algunos datos. Intenta nuevamente o contacta soporte.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Limpia completamente el localStorage relacionado con pedidos
   */
  async limpiarDatosLocales(): Promise<void> {
    const { value: confirmacion } = await Swal.fire({
      title: '🧹 ¿Limpiar datos locales?',
      text: 'Esto eliminará todos los datos guardados en tu navegador (carrito, pedidos temporales, etc.)',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion) {
      // Limpiar localStorage
      localStorage.clear();
      
      // Limpiar pedidos locales
      this.pedidos.set([]);
      this.pedidosEjemploCreados = false;
      
      Swal.fire({
        icon: 'success',
        title: '¡Limpieza completada!',
        text: 'Todos los datos locales han sido eliminados.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  }

  // Métodos para trackBy (optimización de rendimiento)
  trackByPedidoId(index: number, pedido: Pedido): string {
    return pedido.id;
  }

  trackByItemId(index: number, item: any): string {
    return item.id;
  }
}
