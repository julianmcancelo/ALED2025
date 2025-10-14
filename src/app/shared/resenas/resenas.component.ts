import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResenasService, Resena, EstadisticasVendedor } from '../../servicios/resenas.service';
import { AuthService } from '../../auth/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-resenas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="resenas-container">
      <!-- Estadísticas del vendedor -->
      @if (estadisticasVendedor) {
        <div class="vendedor-stats">
          <div class="vendedor-header">
            <div class="vendedor-avatar">
              <i class="bi bi-shop"></i>
            </div>
            <div class="vendedor-info">
              <h3 class="vendedor-nombre">{{ estadisticasVendedor.nombre }}</h3>
              <div class="vendedor-badges">
                <span class="reputacion-badge" [class]="'badge-' + estadisticasVendedor.reputacion.toLowerCase()">
                  {{ estadisticasVendedor.reputacion }}
                </span>
                <div class="calificacion-vendedor">
                  <div class="estrellas-vendedor">
                    @for (estrella of [1,2,3,4,5]; track estrella) {
                      <i class="bi" 
                         [class.bi-star-fill]="estrella <= Math.floor(estadisticasVendedor.calificacionPromedio)"
                         [class.bi-star-half]="estrella === Math.ceil(estadisticasVendedor.calificacionPromedio) && estadisticasVendedor.calificacionPromedio % 1 !== 0"
                         [class.bi-star]="estrella > Math.ceil(estadisticasVendedor.calificacionPromedio)">
                      </i>
                    }
                  </div>
                  <span class="calificacion-numero">{{ estadisticasVendedor.calificacionPromedio }}</span>
                  <span class="total-ventas">({{ estadisticasVendedor.totalVentas | number }} ventas)</span>
                </div>
              </div>
              <div class="vendedor-detalles">
                <span class="detalle-item">
                  <i class="bi bi-calendar"></i>
                  Vendiendo desde {{ estadisticasVendedor.fechaRegistro | date:'MMMM yyyy':'':'es' }}
                </span>
                <span class="detalle-item">
                  <i class="bi bi-hand-thumbs-up"></i>
                  {{ estadisticasVendedor.porcentajePositivas }}% de opiniones positivas
                </span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Resumen de calificaciones del producto -->
      @if (promedioProducto) {
        <div class="calificaciones-resumen">
          <h3>Opiniones del producto</h3>
          <div class="resumen-principal">
            <div class="promedio-grande">
              <span class="numero-promedio">{{ promedioProducto.promedio }}</span>
              <div class="estrellas-promedio">
                @for (estrella of [1,2,3,4,5]; track estrella) {
                  <i class="bi" 
                     [class.bi-star-fill]="estrella <= Math.floor(promedioProducto.promedio)"
                     [class.bi-star-half]="estrella === Math.ceil(promedioProducto.promedio) && promedioProducto.promedio % 1 !== 0"
                     [class.bi-star]="estrella > Math.ceil(promedioProducto.promedio)">
                  </i>
                }
              </div>
              <span class="total-opiniones">{{ promedioProducto.total }} opiniones</span>
            </div>
            
            <!-- Distribución de calificaciones -->
            @if (distribucionCalificaciones) {
              <div class="distribucion-barras">
                @for (calificacion of [5,4,3,2,1]; track calificacion) {
                  <div class="barra-calificacion">
                    <span class="numero-estrellas">{{ calificacion }}</span>
                    <i class="bi bi-star-fill"></i>
                    <div class="barra-progreso">
                      <div class="barra-relleno" 
                           [style.width.%]="promedioProducto.total > 0 ? (distribucionCalificaciones[calificacion] / promedioProducto.total) * 100 : 0">
                      </div>
                    </div>
                    <span class="cantidad-votos">{{ distribucionCalificaciones[calificacion] }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Formulario para nueva reseña -->
      @if (puedeResenar && authService.currentUserSignal()) {
        <div class="nueva-resena">
          <h4>Dejá tu opinión</h4>
          <form (ngSubmit)="enviarResena()" class="resena-form">
            <div class="calificacion-selector">
              <label>Tu calificación:</label>
              <div class="estrellas-selector">
                @for (estrella of [1,2,3,4,5]; track estrella) {
                  <i class="bi bi-star-fill estrella-selectable"
                     [class.activa]="estrella <= nuevaResena.calificacion"
                     (click)="seleccionarCalificacion(estrella)">
                  </i>
                }
              </div>
            </div>
            
            <div class="comentario-grupo">
              <label for="comentario">Tu comentario:</label>
              <textarea 
                id="comentario"
                [(ngModel)]="nuevaResena.comentario"
                name="comentario"
                placeholder="Contanos tu experiencia con este producto..."
                rows="4"
                maxlength="500"
                required>
              </textarea>
              <small class="contador-caracteres">{{ nuevaResena.comentario.length }}/500</small>
            </div>
            
            <button type="submit" 
                    class="btn-enviar-resena"
                    [disabled]="nuevaResena.calificacion === 0 || nuevaResena.comentario.trim().length < 10">
              <i class="bi bi-send"></i>
              Enviar opinión
            </button>
          </form>
        </div>
      } @else if (!authService.currentUserSignal()) {
        <div class="login-requerido">
          <i class="bi bi-person-circle"></i>
          <p>Iniciá sesión para dejar tu opinión sobre este producto</p>
        </div>
      }

      <!-- Lista de reseñas -->
      <div class="lista-resenas">
        <h4>Opiniones de compradores</h4>
        @if (resenas.length > 0) {
          @for (resena of resenas; track resena.id) {
            <div class="resena-item">
              <div class="resena-header">
                <div class="usuario-info">
                  <div class="usuario-avatar">
                    <i class="bi bi-person-circle"></i>
                  </div>
                  <div class="usuario-datos">
                    <span class="usuario-nombre">{{ resena.usuarioNombre }}</span>
                    @if (resena.verificada) {
                      <span class="compra-verificada">
                        <i class="bi bi-patch-check-fill"></i>
                        Compra verificada
                      </span>
                    }
                  </div>
                </div>
                <div class="resena-meta">
                  <div class="estrellas-resena">
                    @for (estrella of [1,2,3,4,5]; track estrella) {
                      <i class="bi" 
                         [class.bi-star-fill]="estrella <= resena.calificacion"
                         [class.bi-star]="estrella > resena.calificacion">
                      </i>
                    }
                  </div>
                  <span class="fecha-resena">{{ resena.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
              
              <div class="resena-contenido">
                <p class="comentario-texto">{{ resena.comentario }}</p>
                
                @if (resena.respuestaVendedor) {
                  <div class="respuesta-vendedor">
                    <div class="respuesta-header">
                      <i class="bi bi-shop"></i>
                      <strong>Respuesta del vendedor</strong>
                      <span class="fecha-respuesta">{{ resena.respuestaVendedor.fecha | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <p class="respuesta-texto">{{ resena.respuestaVendedor.mensaje }}</p>
                  </div>
                }
                
                <div class="resena-acciones">
                  <button class="btn-util" (click)="marcarUtil(resena.id)">
                    <i class="bi bi-hand-thumbs-up"></i>
                    Útil ({{ resena.util }})
                  </button>
                </div>
              </div>
            </div>
          }
        } @else {
          <div class="sin-resenas">
            <i class="bi bi-chat-dots"></i>
            <p>Aún no hay opiniones sobre este producto</p>
            <small>¡Sé el primero en dejar tu comentario!</small>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./resenas.component.css']
})
export class ResenasComponent implements OnInit {
  @Input() productoId!: string;
  
  private resenasService = inject(ResenasService);
  public authService = inject(AuthService);

  resenas: Resena[] = [];
  estadisticasVendedor: EstadisticasVendedor | null = null;
  promedioProducto: { promedio: number; total: number } | null = null;
  distribucionCalificaciones: { [key: number]: number } | null = null;
  puedeResenar = false;

  nuevaResena = {
    calificacion: 0,
    comentario: ''
  };

  // Exponer Math para usar en template
  Math = Math;

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    // Cargar estadísticas del vendedor
    this.resenasService.obtenerEstadisticasVendedor().subscribe(stats => {
      this.estadisticasVendedor = stats;
    });

    // Cargar reseñas del producto
    this.resenasService.obtenerResenasPorProducto(this.productoId).subscribe(resenas => {
      this.resenas = resenas;
    });

    // Cargar promedio del producto
    this.resenasService.obtenerPromedioCalificacion(this.productoId).subscribe(promedio => {
      this.promedioProducto = promedio;
    });

    // Cargar distribución de calificaciones
    this.resenasService.obtenerDistribucionCalificaciones(this.productoId).subscribe(distribucion => {
      this.distribucionCalificaciones = distribucion;
    });

    // Verificar si puede dejar reseña
    this.resenasService.puedeDejarResena(this.productoId).subscribe(puede => {
      this.puedeResenar = puede;
    });
  }

  seleccionarCalificacion(calificacion: number): void {
    this.nuevaResena.calificacion = calificacion;
  }

  enviarResena(): void {
    if (this.nuevaResena.calificacion === 0 || this.nuevaResena.comentario.trim().length < 10) {
      return;
    }

    const currentUser = this.authService.currentUserSignal();
    if (!currentUser) {
      return;
    }

    const resena = {
      productoId: this.productoId,
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombre + ' ' + currentUser.apellido,
      calificacion: this.nuevaResena.calificacion,
      comentario: this.nuevaResena.comentario.trim(),
      verificada: true // Simulamos que es una compra verificada
    };

    this.resenasService.agregarResena(resena).subscribe(success => {
      if (success) {
        Swal.fire({
          title: '¡Gracias por tu opinión!',
          text: 'Tu reseña ha sido publicada correctamente.',
          icon: 'success',
          confirmButtonText: 'Continuar'
        });
        
        // Resetear formulario
        this.nuevaResena = { calificacion: 0, comentario: '' };
        
        // Recargar datos
        this.cargarDatos();
      }
    });
  }

  marcarUtil(resenaId: string): void {
    this.resenasService.marcarComoUtil(resenaId).subscribe(success => {
      if (success) {
        // Recargar reseñas para mostrar el contador actualizado
        this.resenasService.obtenerResenasPorProducto(this.productoId).subscribe(resenas => {
          this.resenas = resenas;
        });
      }
    });
  }
}
