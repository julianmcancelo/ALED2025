/**
 * COMPONENTE DE MÉTODO DE PAGO VIRTUAL
 * 
 * Este componente permite a los usuarios seleccionar y usar su tarjeta virtual
 * como método de pago alternativo a Mercado Pago. Simula el flujo completo
 * de autorización y procesamiento de pagos.
 * 
 * Dependencias:
 * - PagoVirtualService: Para procesar pagos virtuales
 * - TarjetaVirtualService: Para obtener datos de la tarjeta
 * - AuthService: Para obtener el usuario actual
 * - Angular Material: Para componentes de UI
 * 
 * Flujo general:
 * 1. Mostrar tarjeta virtual del usuario
 * 2. Permitir selección como método de pago
 * 3. Validar saldo suficiente
 * 4. Procesar pago (crear, autorizar, confirmar)
 * 5. Mostrar resultado y actualizar saldo
 */

import { Component, Input, Output, EventEmitter, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

// Importamos nuestros servicios y modelos
import { PagoVirtualService } from '../../../servicios/pago-virtual.service';
import { TarjetaVirtualService } from '../../../servicios/tarjeta-virtual.service';
import { AuthService } from '../../../auth/auth';
import {
  TarjetaVirtual,
  PagoVirtual,
  SolicitudCrearPago
} from '../../models/tarjeta-virtual.model';

/**
 * Interfaz para los datos del pago a procesar
 */
export interface DatosPago {
  monto: number;
  descripcion: string;
  referenciaExterna?: string;
  detalleProducto?: {
    nombre: string;
    categoria: string;
    cantidad: number;
    precioUnitario: number;
  };
}

/**
 * Interfaz para el resultado del pago
 */
export interface ResultadoPago {
  exito: boolean;
  pagoId?: string;
  mensaje: string;
  error?: string;
}

@Component({
  selector: 'app-metodo-pago-virtual',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './metodo-pago-virtual.component.html',
  styleUrls: ['./metodo-pago-virtual.component.css']
})
export class MetodoPagoVirtualComponent implements OnInit {
  /**
   * Datos del pago a procesar
   */
  @Input() datosPago!: DatosPago;

  /**
   * Indica si el componente está habilitado para procesar pagos
   */
  @Input() habilitado: boolean = true;

  /**
   * Evento emitido cuando se completa el pago
   */
  @Output() pagoCompletado = new EventEmitter<ResultadoPago>();

  /**
   * Evento emitido cuando se cancela el pago
   */
  @Output() pagoCancelado = new EventEmitter<void>();

  // Servicios inyectados
  private pagoService = inject(PagoVirtualService);
  private tarjetaService = inject(TarjetaVirtualService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Signals para manejo reactivo del estado
  private readonly tarjeta = signal<TarjetaVirtual | null>(null);
  private readonly cargandoTarjeta = signal<boolean>(true);
  private readonly procesandoPago = signal<boolean>(false);
  private readonly error = signal<string | null>(null);

  // Computed signals para datos derivados
  readonly tarjetaData = computed(() => this.tarjeta());
  readonly usuarioActual = computed(() => this.authService.currentUserSignal());
  readonly estaCargandoTarjeta = computed(() => this.cargandoTarjeta());
  readonly estaProcesandoPago = computed(() => this.procesandoPago());
  readonly hayError = computed(() => this.error());
  
  readonly puedeUsarTarjeta = computed(() => {
    const tarjeta = this.tarjeta();
    const datos = this.datosPago;
    
    if (!tarjeta || !datos) return false;
    
    return tarjeta.estado === 'activa' && 
           tarjeta.habilitadaOnline && 
           tarjeta.saldo >= datos.monto;
  });

  readonly motivoNoDisponible = computed(() => {
    const tarjeta = this.tarjeta();
    const datos = this.datosPago;
    
    if (!tarjeta) return 'No tienes una tarjeta virtual';
    if (tarjeta.estado !== 'activa') return `Tarjeta ${tarjeta.estado}`;
    if (!tarjeta.habilitadaOnline) return 'Tarjeta no habilitada para pagos online';
    if (!datos) return 'Datos de pago no válidos';
    if (tarjeta.saldo < datos.monto) return 'Saldo insuficiente';
    
    return '';
  });

  /**
   * Inicializa el componente y carga la tarjeta del usuario
   */
  ngOnInit(): void {
    this.cargarTarjetaUsuario();
  }

  /**
   * Carga la tarjeta virtual del usuario actual
   */
  private async cargarTarjetaUsuario(): Promise<void> {
    const usuario = this.usuarioActual();
    if (!usuario?.id) {
      this.error.set('Usuario no autenticado');
      this.cargandoTarjeta.set(false);
      return;
    }

    try {
      this.cargandoTarjeta.set(true);
      this.error.set(null);

      console.log(`🎯 Cargando tarjeta virtual para usuario: ${usuario.id}`);

      const tarjeta = await this.tarjetaService.obtenerTarjetaPorUsuario(usuario.id);
      this.tarjeta.set(tarjeta);

      if (!tarjeta) {
        this.error.set('No se encontró una tarjeta virtual para tu cuenta');
      }

    } catch (error) {
      console.error('❌ Error al cargar tarjeta virtual:', error);
      this.error.set('Error al cargar la tarjeta virtual');
    } finally {
      this.cargandoTarjeta.set(false);
    }
  }

  /**
   * Procesa el pago usando la tarjeta virtual
   * Ejecuta el flujo completo: crear, autorizar y confirmar
   */
  async procesarPago(): Promise<void> {
    const usuario = this.usuarioActual();
    const tarjeta = this.tarjeta();
    
    if (!usuario?.id || !tarjeta?.id || !this.datosPago) {
      this.snackBar.open('Datos incompletos para procesar el pago', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.puedeUsarTarjeta()) {
      this.snackBar.open(this.motivoNoDisponible(), 'Cerrar', { duration: 3000 });
      return;
    }

    try {
      this.procesandoPago.set(true);

      console.log('💳 Iniciando procesamiento de pago virtual:', {
        monto: this.datosPago.monto,
        descripcion: this.datosPago.descripcion,
        tarjetaId: tarjeta.id
      });

      // 1. Crear intento de pago
      const solicitudPago: SolicitudCrearPago = {
        tarjetaId: tarjeta.id,
        monto: this.datosPago.monto,
        descripcion: this.datosPago.descripcion,
        referenciaExterna: this.datosPago.referenciaExterna,
        detalleProducto: this.datosPago.detalleProducto,
        claveIdempotencia: `pago-${usuario.id}-${Date.now()}`
      };

      const resultadoCreacion = await this.pagoService.crearIntentoPago(solicitudPago, usuario.id);
      
      if (!resultadoCreacion.exito || !resultadoCreacion.pago?.id) {
        throw new Error(resultadoCreacion.mensaje);
      }

      const pagoId = resultadoCreacion.pago.id;
      console.log('✅ Intento de pago creado:', pagoId);

      // 2. Autorizar pago
      const resultadoAutorizacion = await this.pagoService.autorizarPago(pagoId, usuario.id);
      
      if (!resultadoAutorizacion.exito) {
        throw new Error(resultadoAutorizacion.mensaje);
      }

      console.log('✅ Pago autorizado:', pagoId);

      // 3. Confirmar pago
      const resultadoConfirmacion = await this.pagoService.confirmarPago(pagoId, usuario.id);
      
      if (!resultadoConfirmacion.exito) {
        throw new Error(resultadoConfirmacion.mensaje);
      }

      console.log('✅ Pago confirmado:', pagoId);

      // 4. Recargar tarjeta para mostrar saldo actualizado
      await this.cargarTarjetaUsuario();

      // 5. Emitir evento de éxito
      this.pagoCompletado.emit({
        exito: true,
        pagoId,
        mensaje: 'Pago procesado correctamente'
      });

      this.snackBar.open('¡Pago realizado con éxito!', 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });

    } catch (error) {
      console.error('❌ Error al procesar pago:', error);
      
      const mensaje = error instanceof Error ? error.message : 'Error desconocido al procesar el pago';
      
      this.pagoCompletado.emit({
        exito: false,
        mensaje: 'Error al procesar el pago',
        error: mensaje
      });

      this.snackBar.open(`Error: ${mensaje}`, 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });

    } finally {
      this.procesandoPago.set(false);
    }
  }

  /**
   * Cancela el proceso de pago
   */
  cancelarPago(): void {
    this.pagoCancelado.emit();
  }

  /**
   * Recarga los datos de la tarjeta
   */
  async recargarTarjeta(): Promise<void> {
    await this.cargarTarjetaUsuario();
  }

  /**
   * Formatea un número de tarjeta para mostrar solo los últimos 4 dígitos
   */
  formatearNumeroTarjeta(numero: string): string {
    return this.tarjetaService.enmascararNumeroTarjeta(numero);
  }

  /**
   * Formatea un monto de dinero
   */
  formatearMonto(monto: number): string {
    return `$${monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Obtiene el color del estado de la tarjeta
   */
  getColorEstado(): string {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return 'default';
    
    switch (tarjeta.estado) {
      case 'activa': return 'primary';
      case 'bloqueada': return 'warn';
      case 'suspendida': return 'accent';
      default: return 'default';
    }
  }

  /**
   * Obtiene el texto del estado de la tarjeta
   */
  getTextoEstado(): string {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return '';
    
    switch (tarjeta.estado) {
      case 'activa': return 'Activa';
      case 'bloqueada': return 'Bloqueada';
      case 'suspendida': return 'Suspendida';
      default: return 'Desconocido';
    }
  }
}
