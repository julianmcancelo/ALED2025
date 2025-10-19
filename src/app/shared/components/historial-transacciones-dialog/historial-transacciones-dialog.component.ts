import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { TarjetaVirtualService } from '../../../servicios/tarjeta-virtual.service';
import { TransaccionTarjeta, TarjetaVirtual, TipoTransaccion } from '../../models/tarjeta-virtual.model';

export interface HistorialTransaccionesDialogData {
  tarjeta: TarjetaVirtual;
}

@Component({
  selector: 'app-historial-transacciones-dialog',
  standalone: true,
  styleUrls: ['./historial-transacciones-dialog.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="historial-dialog">
      <!-- Header simple -->
      <div mat-dialog-title class="dialog-header">
        <h3 class="dialog-title">Historial de movimientos</h3>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Info de tarjeta -->
      <div class="tarjeta-info-box">
        <div class="saldo-display">
          <span class="saldo-label">Saldo disponible</span>
          <span class="saldo-monto">{{ data.tarjeta.saldo | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
        </div>
        <div class="tarjeta-numero">
          <mat-icon class="card-icon">credit_card</mat-icon>
          <span>****{{ data.tarjeta.numero.slice(-4) }}</span>
        </div>
      </div>

      <div mat-dialog-content class="dialog-content">
        @if (cargando()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando movimientos...</p>
          </div>
        } @else if (error()) {
          <div class="error-container">
            <mat-icon class="error-icon">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="cargarTransacciones()">
              Reintentar
            </button>
          </div>
        } @else if (transacciones().length === 0) {
          <div class="empty-container">
            <mat-icon class="empty-icon">receipt_long</mat-icon>
            <h4>Sin movimientos</h4>
            <p>Aún no hay transacciones registradas.</p>
          </div>
        } @else {
          <!-- Lista de transacciones estilo ML -->
          <div class="transacciones-lista">
            @for (transaccion of transacciones(); track transaccion.id) {
              <div class="transaccion-item">
                <div class="transaccion-row">
                  <!-- Icono -->
                  <div class="transaccion-icono" [class]="getTipoClass(transaccion.tipo)">
                    <mat-icon>{{ getTipoIcon(transaccion.tipo) }}</mat-icon>
                  </div>

                  <!-- Info -->
                  <div class="transaccion-info">
                    <div class="transaccion-tipo-label">{{ getTipoLabel(transaccion.tipo) }}</div>
                    <div class="transaccion-descripcion">{{ transaccion.descripcion }}</div>
                    <div class="transaccion-fecha">{{ transaccion.fecha | date:'dd/MM/yyyy HH:mm' }}</div>
                  </div>

                  <!-- Monto -->
                  <div class="transaccion-monto" [class]="getMontoClass(transaccion.monto)">
                    {{ transaccion.monto > 0 ? '+' : '' }}{{ transaccion.monto | currency:'ARS':'symbol-narrow':'1.0-0' }}
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="cargarTransacciones()" [disabled]="cargando()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
        <button mat-raised-button color="primary" mat-dialog-close>
          <mat-icon>close</mat-icon>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .historial-dialog {
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      background: #f5f5f5;
    }

    /* Header */
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      margin: 0;
      background: white;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .close-button {
      color: #666;
    }

    /* Info de tarjeta */
    .tarjeta-info-box {
      background: white;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .saldo-display {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .saldo-label {
      font-size: 13px;
      color: #666;
    }

    .saldo-monto {
      font-size: 28px;
      font-weight: 700;
      color: #00a650;
    }

    .tarjeta-numero {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .card-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Content */
    .dialog-content {
      padding: 16px 24px;
      max-height: 50vh;
      overflow-y: auto;
      background: #f5f5f5;
    }

    .loading-container, .error-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      background: white;
      border-radius: 6px;
      margin: 8px 0;
    }

    .error-icon, .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #999;
      margin-bottom: 12px;
    }

    .error-icon {
      color: #f04449;
    }

    /* Lista de transacciones */
    .transacciones-lista {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .transaccion-item {
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      transition: box-shadow 0.2s;
    }

    .transaccion-item:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .transaccion-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
    }

    /* Icono de transacción */
    .transaccion-icono {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .transaccion-icono mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: white;
    }

    .transaccion-icono.recarga {
      background: #00a650;
    }

    .transaccion-icono.pago {
      background: #3483fa;
    }

    .transaccion-icono.reembolso {
      background: #9c27b0;
    }

    .transaccion-icono.descuento {
      background: #f04449;
    }

    .transaccion-icono.bloqueo,
    .transaccion-icono.desbloqueo {
      background: #666;
    }

    /* Info de transacción */
    .transaccion-info {
      flex: 1;
      min-width: 0;
    }

    .transaccion-tipo-label {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .transaccion-descripcion {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .transaccion-fecha {
      font-size: 12px;
      color: #999;
    }

    /* Monto */
    .transaccion-monto {
      font-size: 18px;
      font-weight: 700;
      white-space: nowrap;
    }

    .transaccion-monto.positivo {
      color: #00a650;
    }

    .transaccion-monto.negativo {
      color: #333;
    }

    .dialog-actions {
      padding: 16px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .historial-dialog {
        max-width: 100vw;
        max-height: 100vh;
      }

      .dialog-header {
        padding: 16px;
      }

      .dialog-title {
        font-size: 18px;
      }

      .tarjeta-info-box {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
      }

      .saldo-monto {
        font-size: 24px;
      }

      .dialog-content {
        padding: 12px 16px;
      }

      .transaccion-row {
        padding: 12px;
        gap: 12px;
      }

      .transaccion-icono {
        width: 40px;
        height: 40px;
      }

      .transaccion-icono mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .transaccion-tipo-label {
        font-size: 14px;
      }

      .transaccion-monto {
        font-size: 16px;
      }

      .dialog-actions {
        padding: 12px 16px;
      }
    }
  `]
})
export class HistorialTransaccionesDialogComponent implements OnInit {
  readonly transacciones = signal<TransaccionTarjeta[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Computed signals para estadísticas
  readonly totalIngresos = signal<number>(0);
  readonly totalEgresos = signal<number>(0);

  constructor(
    public dialogRef: MatDialogRef<HistorialTransaccionesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HistorialTransaccionesDialogData,
    private tarjetaVirtualService: TarjetaVirtualService
  ) {}

  ngOnInit(): void {
    this.cargarTransacciones();
  }

  async cargarTransacciones(): Promise<void> {
    try {
      this.cargando.set(true);
      this.error.set(null);

      const historial = await this.tarjetaVirtualService.obtenerHistorialTransacciones(
        this.data.tarjeta.id!,
        100 // Cargar más transacciones en el modal
      );

      this.transacciones.set(historial);
      this.calcularEstadisticas(historial);

    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      this.error.set('Error al cargar las transacciones. Por favor, inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  private calcularEstadisticas(transacciones: TransaccionTarjeta[]): void {
    let ingresos = 0;
    let egresos = 0;

    transacciones.forEach(transaccion => {
      if (transaccion.monto > 0) {
        ingresos += transaccion.monto;
      } else {
        egresos += Math.abs(transaccion.monto);
      }
    });

    this.totalIngresos.set(ingresos);
    this.totalEgresos.set(egresos);
  }

  getTipoClass(tipo: string): string {
    return tipo.toLowerCase();
  }

  getTipoIcon(tipo: string): string {
    const iconMap: { [key: string]: string } = {
      'recarga': 'add_circle',
      'pago': 'payment',
      'reembolso': 'undo',
      'descuento': 'remove_circle',
      'bloqueo': 'block',
      'desbloqueo': 'check_circle'
    };
    return iconMap[tipo] || 'receipt';
  }

  getTipoLabel(tipo: string): string {
    const labelMap: { [key: string]: string } = {
      'recarga': 'Recarga',
      'pago': 'Pago',
      'reembolso': 'Reembolso',
      'descuento': 'Descuento',
      'bloqueo': 'Bloqueo',
      'desbloqueo': 'Desbloqueo'
    };
    return labelMap[tipo] || tipo;
  }

  getMontoClass(monto: number): string {
    return monto > 0 ? 'positivo' : 'negativo';
  }
}
