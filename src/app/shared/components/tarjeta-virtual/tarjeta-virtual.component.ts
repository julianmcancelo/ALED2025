/**
 * COMPONENTE DE TARJETA VIRTUAL
 * 
 * Este componente muestra la tarjeta virtual del usuario con un diseño
 * estético similar a una tarjeta de crédito real. Incluye animaciones,
 * efectos visuales y funcionalidades interactivas.
 * 
 * Dependencias:
 * - Angular Material: Para iconos y elementos de UI
 * - TarjetaVirtualService: Para obtener datos de la tarjeta
 * - Animaciones CSS: Para efectos visuales
 * 
 * Flujo general:
 * 1. Obtener datos de la tarjeta del usuario autenticado
 * 2. Mostrar información enmascarada por seguridad
 * 3. Permitir ver/ocultar número completo temporalmente
 * 4. Mostrar saldo y estado de la tarjeta
 * 5. Proporcionar acceso al historial de transacciones
 */

import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

// Importamos nuestros servicios y modelos
import { TarjetaVirtualService } from '../../../servicios/tarjeta-virtual.service';
import { TarjetaVirtual, TransaccionTarjeta } from '../../models/tarjeta-virtual.model';
import { HistorialTransaccionesDialogComponent } from '../historial-transacciones-dialog/historial-transacciones-dialog.component';

/**
 * Pipe personalizado para formatear montos de dinero
 */
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-tarjeta-virtual',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CurrencyPipe
  ],
  templateUrl: './tarjeta-virtual.component.html',
  styleUrls: ['./tarjeta-virtual.component.css']
})
export class TarjetaVirtualComponent implements OnInit, OnDestroy {
  /**
   * ID del usuario propietario de la tarjeta
   * Debe ser proporcionado por el componente padre
   */
  @Input() usuarioId!: string;

  /**
   * Indica si se debe mostrar el historial de transacciones
   * Por defecto es false para mostrar solo la tarjeta
   */
  @Input() mostrarHistorial: boolean = false;

  // Signals para manejo reactivo del estado
  private readonly tarjeta = signal<TarjetaVirtual | null>(null);
  private readonly cargando = signal<boolean>(true);
  private readonly error = signal<string | null>(null);
  readonly mostrarNumeroCompleto = signal<boolean>(false);
  readonly transacciones = signal<TransaccionTarjeta[]>([]);

  // Computed signals para datos derivados
  readonly tarjetaData = computed(() => this.tarjeta());
  readonly estaCargando = computed(() => this.cargando());
  readonly hayError = computed(() => this.error());
  readonly numeroVisible = computed(() => {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return '';
    
    return this.mostrarNumeroCompleto() 
      ? this.formatearNumeroTarjeta(tarjeta.numero)
      : this.tarjetaVirtualService.enmascararNumeroTarjeta(tarjeta.numero);
  });
  readonly estadoColor = computed(() => {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return 'default';
    
    switch (tarjeta.estado) {
      case 'activa': return 'primary';
      case 'bloqueada': return 'warn';
      case 'suspendida': return 'accent';
      default: return 'default';
    }
  });
  readonly estadoTexto = computed(() => {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return '';
    
    switch (tarjeta.estado) {
      case 'activa': return 'Activa';
      case 'bloqueada': return 'Bloqueada';
      case 'suspendida': return 'Suspendida';
      default: return 'Desconocido';
    }
  });

  // Subject para manejar la destrucción del componente
  private readonly destroy$ = new Subject<void>();

  constructor(
    private tarjetaVirtualService: TarjetaVirtualService,
    private dialog: MatDialog
  ) {}

  /**
   * Inicializa el componente y carga los datos de la tarjeta
   */
  ngOnInit(): void {
    if (!this.usuarioId) {
      this.error.set('ID de usuario no proporcionado');
      this.cargando.set(false);
      return;
    }

    this.cargarTarjeta();
    
    if (this.mostrarHistorial) {
      this.cargarHistorialTransacciones();
    }
  }

  /**
   * Limpia las suscripciones al destruir el componente
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos de la tarjeta virtual del usuario
   */
  private async cargarTarjeta(): Promise<void> {
    try {
      this.cargando.set(true);
      this.error.set(null);

      console.log(`🎯 Cargando tarjeta virtual para usuario: ${this.usuarioId}`);

      const tarjeta = await this.tarjetaVirtualService.obtenerTarjetaPorUsuario(this.usuarioId);
      
      if (!tarjeta) {
        this.error.set('No se encontró una tarjeta virtual para este usuario');
        return;
      }

      this.tarjeta.set(tarjeta);
      console.log(`✅ Tarjeta cargada exitosamente:`, {
        id: tarjeta.id,
        titular: tarjeta.titular,
        saldo: tarjeta.saldo,
        estado: tarjeta.estado
      });

    } catch (error) {
      console.error('❌ Error al cargar tarjeta virtual:', error);
      this.error.set(error instanceof Error ? error.message : 'Error desconocido al cargar la tarjeta');
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Carga el historial de transacciones de la tarjeta
   */
  async cargarHistorialTransacciones(): Promise<void> {
    const tarjeta = this.tarjeta();
    if (!tarjeta?.id) return;

    try {
      console.log(`📋 Cargando historial de transacciones para tarjeta: ${tarjeta.id}`);
      
      // DIAGNÓSTICO TEMPORAL: Listar todas las transacciones
      await this.tarjetaVirtualService.diagnosticarTransacciones();
      
      const historial = await this.tarjetaVirtualService.obtenerHistorialTransacciones(tarjeta.id, 10);
      this.transacciones.set(historial);
      
      console.log(`✅ Se cargaron ${historial.length} transacciones`);
    } catch (error) {
      console.error('❌ Error al cargar historial de transacciones:', error);
    }
  }

  /**
   * Alterna la visibilidad del número completo de la tarjeta
   * Se oculta automáticamente después de 5 segundos por seguridad
   */
  toggleMostrarNumero(): void {
    const mostrar = !this.mostrarNumeroCompleto();
    this.mostrarNumeroCompleto.set(mostrar);

    // Si se está mostrando el número completo, ocultarlo después de 5 segundos
    if (mostrar) {
      setTimeout(() => {
        this.mostrarNumeroCompleto.set(false);
      }, 5000);
    }
  }

  /**
   * Recarga los datos de la tarjeta
   * Útil después de operaciones que modifiquen el saldo
   */
  async recargarTarjeta(): Promise<void> {
    await this.cargarTarjeta();
    
    if (this.mostrarHistorial) {
      await this.cargarHistorialTransacciones();
    }
  }

  /**
   * Copia el número de tarjeta al portapapeles
   */
  async copiarNumeroTarjeta(): Promise<void> {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return;

    try {
      await navigator.clipboard.writeText(tarjeta.numero);
      console.log('✅ Número de tarjeta copiado al portapapeles');
      
      // Aquí podrías mostrar un snackbar o toast de confirmación
      // this.snackBar.open('Número copiado al portapapeles', 'Cerrar', { duration: 2000 });
    } catch (error) {
      console.error('❌ Error al copiar número de tarjeta:', error);
    }
  }

  /**
   * Formatea un número de tarjeta con espacios cada 4 dígitos
   * 
   * @param numero - Número de tarjeta sin formato
   * @returns Número formateado con espacios
   */
  private formatearNumeroTarjeta(numero: string): string {
    return numero.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Obtiene el icono apropiado según el tipo de transacción
   * 
   * @param tipo - Tipo de transacción
   * @returns Nombre del icono de Material Icons
   */
  getIconoTransaccion(tipo: string): string {
    switch (tipo) {
      case 'recarga': return 'add_circle';
      case 'descuento': return 'remove_circle';
      case 'pago': return 'payment';
      case 'reembolso': return 'undo';
      case 'bloqueo': return 'block';
      case 'desbloqueo': return 'check_circle';
      default: return 'help';
    }
  }

  /**
   * Obtiene el color apropiado según el tipo de transacción
   * 
   * @param tipo - Tipo de transacción
   * @returns Clase CSS para el color
   */
  getColorTransaccion(tipo: string): string {
    switch (tipo) {
      case 'recarga': return 'text-green-600';
      case 'reembolso': return 'text-green-600';
      case 'descuento': return 'text-red-600';
      case 'pago': return 'text-red-600';
      case 'bloqueo': return 'text-orange-600';
      case 'desbloqueo': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Formatea el monto de una transacción con signo apropiado
   * 
   * @param monto - Monto de la transacción
   * @param tipo - Tipo de transacción
   * @returns Monto formateado con signo
   */
  formatearMontoTransaccion(monto: number, tipo: string): string {
    const signo = (tipo === 'recarga' || tipo === 'reembolso') ? '+' : 
                  (tipo === 'descuento' || tipo === 'pago') ? '-' : '';
    
    return `${signo}$${Math.abs(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Abre el modal con el historial completo de transacciones
   */
  abrirHistorialCompleto(): void {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return;

    this.dialog.open(HistorialTransaccionesDialogComponent, {
      data: { tarjeta },
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '90vh',
      panelClass: 'historial-transacciones-dialog'
    });
  }

  /**
   * Obtiene el gradiente de fondo apropiado según el estado de la tarjeta
   * 
   * @returns Clase CSS para el gradiente
   */
  getGradienteTarjeta(): string {
    const tarjeta = this.tarjeta();
    if (!tarjeta) return 'bg-gradient-to-br from-gray-400 to-gray-600';
    
    switch (tarjeta.estado) {
      case 'activa': return 'bg-gradient-to-br from-blue-500 to-purple-600';
      case 'bloqueada': return 'bg-gradient-to-br from-red-500 to-red-700';
      case 'suspendida': return 'bg-gradient-to-br from-orange-500 to-orange-700';
      default: return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  }
}
