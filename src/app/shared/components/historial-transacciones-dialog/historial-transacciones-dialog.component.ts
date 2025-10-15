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
      <div mat-dialog-title class="dialog-header">
        <div class="header-content">
          <mat-icon class="header-icon">history</mat-icon>
          <div class="header-text">
            <h2>Historial de Transacciones</h2>
            <p class="tarjeta-info">
              Tarjeta: ****{{ data.tarjeta.numero.slice(-4) }} | 
              Saldo: {{ data.tarjeta.saldo | currency:'ARS':'symbol':'1.2-2' }}
            </p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
        @if (cargando()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando transacciones...</p>
          </div>
        } @else if (error()) {
          <div class="error-container">
            <mat-icon class="error-icon">error</mat-icon>
            <p>{{ error() }}</p>
            <button mat-button color="primary" (click)="cargarTransacciones()">
              <mat-icon>refresh</mat-icon>
              Reintentar
            </button>
          </div>
        } @else if (transacciones().length === 0) {
          <div class="empty-container">
            <mat-icon class="empty-icon">receipt_long</mat-icon>
            <h3>Sin transacciones</h3>
            <p>Aún no hay movimientos registrados en esta tarjeta.</p>
          </div>
        } @else {
          <div class="transacciones-container">
            <div class="estadisticas">
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon">receipt</mat-icon>
                    <div>
                      <div class="stat-number">{{ transacciones().length }}</div>
                      <div class="stat-label">Transacciones</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon ingresos">trending_up</mat-icon>
                    <div>
                      <div class="stat-number ingresos">{{ totalIngresos() | currency:'ARS':'symbol':'1.2-2' }}</div>
                      <div class="stat-label">Ingresos</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              
              <mat-card class="stat-card">
                <mat-card-content>
                  <div class="stat-content">
                    <mat-icon class="stat-icon egresos">trending_down</mat-icon>
                    <div>
                      <div class="stat-number egresos">{{ totalEgresos() | currency:'ARS':'symbol':'1.2-2' }}</div>
                      <div class="stat-label">Egresos</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="transacciones-lista">
              @for (transaccion of transacciones(); track transaccion.id) {
                <mat-card class="transaccion-card">
                  <mat-card-content>
                    <div class="transaccion-header">
                      <div class="transaccion-info">
                        <div class="transaccion-tipo">
                          <mat-chip [class]="getTipoClass(transaccion.tipo)">
                            <mat-icon>{{ getTipoIcon(transaccion.tipo) }}</mat-icon>
                            {{ getTipoLabel(transaccion.tipo) }}
                          </mat-chip>
                        </div>
                        <div class="transaccion-fecha">
                          {{ transaccion.fecha | date:'dd/MM/yyyy HH:mm' }}
                        </div>
                      </div>
                      <div class="transaccion-monto" [class]="getMontoClass(transaccion.monto)">
                        {{ transaccion.monto > 0 ? '+' : '' }}{{ transaccion.monto | currency:'ARS':'symbol':'1.2-2' }}
                      </div>
                    </div>
                    
                    <div class="transaccion-descripcion">
                      {{ transaccion.descripcion }}
                    </div>
                    
                    <div class="transaccion-saldos">
                      <span class="saldo-anterior">
                        Saldo anterior: {{ transaccion.saldoAnterior | currency:'ARS':'symbol':'1.2-2' }}
                      </span>
                      <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      <span class="saldo-nuevo">
                        Saldo nuevo: {{ transaccion.saldoNuevo | currency:'ARS':'symbol':'1.2-2' }}
                      </span>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
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
      max-width: 800px;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 0 24px;
      margin: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .header-text h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .tarjeta-info {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .close-button {
      margin-top: -8px;
    }

    .dialog-content {
      padding: 16px 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .loading-container, .error-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .error-icon, .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
      margin-bottom: 16px;
    }

    .error-icon {
      color: #f44336;
    }

    .estadisticas {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #1976d2;
    }

    .stat-icon.ingresos {
      color: #4caf50;
    }

    .stat-icon.egresos {
      color: #f44336;
    }

    .stat-number {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .stat-number.ingresos {
      color: #4caf50;
    }

    .stat-number.egresos {
      color: #f44336;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    .transacciones-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .transaccion-card {
      border-left: 4px solid #e0e0e0;
      transition: all 0.2s ease;
    }

    .transaccion-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    .transaccion-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .transaccion-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .transaccion-fecha {
      font-size: 12px;
      color: #666;
    }

    .transaccion-monto {
      font-size: 18px;
      font-weight: 600;
    }

    .transaccion-monto.positivo {
      color: #4caf50;
    }

    .transaccion-monto.negativo {
      color: #f44336;
    }

    .transaccion-descripcion {
      font-size: 14px;
      color: #333;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .transaccion-saldos {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
      background: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
    }

    .arrow-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .saldo-nuevo {
      font-weight: 500;
    }

    .dialog-actions {
      padding: 16px 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* Chips de tipo de transacción */
    .mat-mdc-chip.recarga {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .mat-mdc-chip.pago {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .mat-mdc-chip.reembolso {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .mat-mdc-chip.descuento {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .mat-mdc-chip.bloqueo, .mat-mdc-chip.desbloqueo {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .historial-dialog {
        max-width: 100vw;
        max-height: 100vh;
      }

      .estadisticas {
        grid-template-columns: 1fr;
      }

      .transaccion-header {
        flex-direction: column;
        gap: 8px;
      }

      .transaccion-saldos {
        flex-direction: column;
        gap: 4px;
        text-align: center;
      }

      .arrow-icon {
        transform: rotate(90deg);
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
