import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResenasService, EstadisticasVendedor } from '../../servicios/resenas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-estadisticas-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="estadisticas-container">
      <div class="header-section">
        <h2><i class="bi bi-graph-up"></i> Estadísticas del Vendedor</h2>
        <p class="subtitle">Gestiona la información y reputación de tu tienda</p>
      </div>

      @if (estadisticas) {
        <div class="stats-grid">
          <!-- Información Principal -->
          <div class="stat-card principal">
            <div class="card-header">
              <h3><i class="bi bi-shop"></i> Información de la Tienda</h3>
            </div>
            <div class="card-content">
              <div class="info-item">
                <label>Nombre de la tienda:</label>
                <div class="value-display">{{ estadisticas.nombre }}</div>
              </div>
              <div class="info-item">
                <label>Reputación:</label>
                <span class="reputacion-badge" [class]="'badge-' + estadisticas.reputacion.toLowerCase()">
                  {{ estadisticas.reputacion }}
                </span>
              </div>
              <div class="info-item">
                <label>Registrado desde:</label>
                <div class="value-display">
                  <i class="bi bi-calendar"></i>
                  {{ estadisticas.fechaRegistro | date:'MMMM yyyy':'':'es' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Calificaciones -->
          <div class="stat-card calificaciones">
            <div class="card-header">
              <h3><i class="bi bi-star"></i> Calificaciones</h3>
            </div>
            <div class="card-content">
              <div class="rating-display">
                <div class="rating-number">{{ estadisticas.calificacionPromedio }}</div>
                <div class="rating-stars">
                  @for (estrella of [1,2,3,4,5]; track estrella) {
                    <i class="bi" 
                       [class.bi-star-fill]="estrella <= Math.floor(estadisticas.calificacionPromedio)"
                       [class.bi-star-half]="estrella === Math.ceil(estadisticas.calificacionPromedio) && estadisticas.calificacionPromedio % 1 !== 0"
                       [class.bi-star]="estrella > Math.ceil(estadisticas.calificacionPromedio)">
                    </i>
                  }
                </div>
                <div class="rating-text">de 5 estrellas</div>
              </div>
              <div class="rating-details">
                <div class="detail-item">
                  <span class="label">Total de reseñas:</span>
                  <span class="value">{{ estadisticas.totalResenas | number }}</span>
                </div>
                <div class="detail-item positive">
                  <span class="label">Opiniones positivas:</span>
                  <span class="value">{{ estadisticas.porcentajePositivas }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Ventas -->
          <div class="stat-card ventas">
            <div class="card-header">
              <h3><i class="bi bi-bag-check"></i> Ventas</h3>
            </div>
            <div class="card-content">
              <div class="sales-display">
                <div class="sales-number">{{ estadisticas.totalVentas | number }}</div>
                <div class="sales-text">ventas realizadas</div>
              </div>
              <div class="sales-info">
                <div class="info-badge success">
                  <i class="bi bi-trending-up"></i>
                  <span>Vendedor activo</span>
                </div>
                <div class="experience-text">
                  {{ calcularAnosExperiencia() }} años de experiencia
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="stat-card acciones">
            <div class="card-header">
              <h3><i class="bi bi-gear"></i> Acciones</h3>
            </div>
            <div class="card-content">
              <div class="actions-grid">
                <button class="action-btn primary" (click)="actualizarEstadisticas()">
                  <i class="bi bi-arrow-clockwise"></i>
                  Actualizar Estadísticas
                </button>
                <button class="action-btn info" (click)="verDetalleResenas()">
                  <i class="bi bi-chat-dots"></i>
                  Ver Todas las Reseñas
                </button>
                <button class="action-btn success" (click)="exportarDatos()">
                  <i class="bi bi-download"></i>
                  Exportar Datos
                </button>
                <button class="action-btn warning" (click)="gestionarVentas()">
                  <i class="bi bi-plus-circle"></i>
                  Gestionar Ventas
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen de Rendimiento -->
        <div class="performance-section">
          <h3><i class="bi bi-graph-up-arrow"></i> Resumen de Rendimiento</h3>
          <div class="performance-grid">
            <div class="performance-item excellent">
              <div class="performance-icon">
                <i class="bi bi-emoji-smile"></i>
              </div>
              <div class="performance-content">
                <h4>Excelente Reputación</h4>
                <p>Tu calificación de {{ estadisticas.calificacionPromedio }} estrellas te posiciona como MercadoLíder</p>
              </div>
            </div>
            <div class="performance-item good">
              <div class="performance-icon">
                <i class="bi bi-hand-thumbs-up"></i>
              </div>
              <div class="performance-content">
                <h4>Alta Satisfacción</h4>
                <p>{{ estadisticas.porcentajePositivas }}% de tus clientes están satisfechos con sus compras</p>
              </div>
            </div>
            <div class="performance-item info">
              <div class="performance-icon">
                <i class="bi bi-trophy"></i>
              </div>
              <div class="performance-content">
                <h4>Vendedor Experimentado</h4>
                <p>Con {{ estadisticas.totalVentas | number }} ventas realizadas, eres un vendedor confiable</p>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./estadisticas-vendedor.component.css']
})
export class EstadisticasVendedorComponent implements OnInit {
  private resenasService = inject(ResenasService);
  
  estadisticas: EstadisticasVendedor | null = null;
  
  // Exponer Math para usar en template
  Math = Math;

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  private cargarEstadisticas(): void {
    this.resenasService.obtenerEstadisticasVendedor().subscribe({
      next: (stats) => {
        this.estadisticas = stats;
        console.log('📊 Estadísticas cargadas:', stats);
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las estadísticas del vendedor',
          icon: 'error'
        });
      }
    });
  }

  calcularAnosExperiencia(): number {
    if (!this.estadisticas) return 0;
    const ahora = new Date();
    const registro = this.estadisticas.fechaRegistro;
    return Math.floor((ahora.getTime() - registro.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  actualizarEstadisticas(): void {
    Swal.fire({
      title: 'Actualizando...',
      text: 'Recalculando estadísticas desde Firestore',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Recargar estadísticas
    this.resenasService.obtenerEstadisticasVendedor().subscribe({
      next: (stats) => {
        this.estadisticas = stats;
        Swal.fire({
          title: '¡Actualizado!',
          text: 'Las estadísticas se han actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error actualizando:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron actualizar las estadísticas',
          icon: 'error'
        });
      }
    });
  }

  verDetalleResenas(): void {
    Swal.fire({
      title: 'Próximamente',
      text: 'Esta funcionalidad estará disponible en una próxima actualización',
      icon: 'info'
    });
  }

  exportarDatos(): void {
    if (!this.estadisticas) return;

    const datos = {
      vendedor: this.estadisticas,
      fechaExportacion: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estadisticas-aled2025-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    Swal.fire({
      title: '¡Exportado!',
      text: 'Los datos se han descargado correctamente',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }

  gestionarVentas(): void {
    Swal.fire({
      title: 'Gestionar Ventas',
      html: `
        <div style="text-align: left;">
          <p><strong>Ventas actuales:</strong> ${this.estadisticas?.totalVentas || 0}</p>
          <br>
          <label for="nuevasVentas" style="display: block; margin-bottom: 5px;">Nuevo total de ventas:</label>
          <input type="number" id="nuevasVentas" class="swal2-input" placeholder="Ingresa el nuevo total" value="${this.estadisticas?.totalVentas || 0}" min="0">
          <br>
          <small style="color: #666;">O incrementar ventas:</small>
          <br>
          <label for="incremento" style="display: block; margin-bottom: 5px;">Incrementar en:</label>
          <input type="number" id="incremento" class="swal2-input" placeholder="Cantidad a incrementar" value="1" min="1">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar Total',
      cancelButtonText: 'Incrementar',
      showDenyButton: true,
      denyButtonText: 'Cancelar',
      preConfirm: () => {
        const nuevasVentas = (document.getElementById('nuevasVentas') as HTMLInputElement).value;
        if (!nuevasVentas || parseInt(nuevasVentas) < 0) {
          Swal.showValidationMessage('Por favor ingresa un número válido');
          return false;
        }
        return { accion: 'actualizar', valor: parseInt(nuevasVentas) };
      },
      preDeny: () => {
        return { accion: 'cancelar' };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        // Actualizar total de ventas
        this.resenasService.actualizarTotalVentas(result.value.valor).then(() => {
          Swal.fire({
            title: '¡Actualizado!',
            text: `Total de ventas actualizado a ${result.value.valor}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarEstadisticas(); // Recargar datos
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Incrementar ventas
        const incremento = parseInt((document.getElementById('incremento') as HTMLInputElement).value) || 1;
        this.resenasService.incrementarVentas(incremento).then(() => {
          Swal.fire({
            title: '¡Incrementado!',
            text: `Se agregaron ${incremento} ventas al total`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarEstadisticas(); // Recargar datos
        });
      }
    });
  }

  configurarNotificaciones(): void {
    Swal.fire({
      title: 'Configurar Notificaciones',
      text: 'Esta funcionalidad estará disponible próximamente',
      icon: 'info'
    });
  }
}
