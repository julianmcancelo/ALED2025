import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaService, Categoria } from '../servicios/categoria.service';
import { Observable } from 'rxjs';

/**
 * COMPONENTE DE PRUEBA PARA LEER CATEGORÍAS DE SUPABASE
 * ====================================================
 * 
 * Componente simple para verificar que la lectura de categorías
 * desde Supabase funcione correctamente
 */

@Component({
  selector: 'app-test-categorias',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h3 class="mb-0">🧪 Prueba de Lectura de Categorías desde Supabase</h3>
        </div>
        <div class="card-body">
          
          <!-- Botones de Acción -->
          <div class="mb-3">
            <button 
              class="btn btn-success me-2" 
              (click)="cargarCategorias()"
              [disabled]="cargando">
              <i class="bi bi-arrow-clockwise"></i>
              {{ cargando ? 'Cargando...' : 'Cargar Categorías' }}
            </button>
            
            <button 
              class="btn btn-info me-2" 
              (click)="crearCategoriaEjemplo()"
              [disabled]="cargando">
              <i class="bi bi-plus-circle"></i>
              Crear Categoría de Ejemplo
            </button>
            
            <button 
              class="btn btn-warning" 
              (click)="limpiarResultados()">
              <i class="bi bi-x-circle"></i>
              Limpiar
            </button>
          </div>

          <!-- Estado de Carga -->
          <div *ngIf="cargando" class="alert alert-info">
            <div class="d-flex align-items-center">
              <div class="spinner-border spinner-border-sm me-2" role="status"></div>
              <span>Cargando categorías desde Supabase...</span>
            </div>
          </div>

          <!-- Errores -->
          <div *ngIf="error" class="alert alert-danger">
            <h5><i class="bi bi-exclamation-triangle"></i> Error</h5>
            <p class="mb-0">{{ error }}</p>
          </div>

          <!-- Resultados -->
          <div *ngIf="categorias.length > 0 && !cargando" class="alert alert-success">
            <h5><i class="bi bi-check-circle"></i> ¡Conexión Exitosa!</h5>
            <p class="mb-0">Se encontraron <strong>{{ categorias.length }}</strong> categorías en Supabase.</p>
          </div>

          <!-- Lista de Categorías -->
          <div *ngIf="categorias.length > 0" class="mt-4">
            <h4>📂 Categorías Encontradas:</h4>
            <div class="row">
              <div 
                *ngFor="let categoria of categorias; let i = index" 
                class="col-md-6 col-lg-4 mb-3">
                <div class="card border-primary">
                  <div class="card-body">
                    <h6 class="card-title">
                      <i class="bi bi-tag"></i>
                      {{ categoria.nombre }}
                    </h6>
                    <p class="card-text small text-muted">
                      <strong>ID:</strong> {{ categoria.id }}<br>
                      <strong>Activo:</strong> 
                      <span class="badge" [class]="categoria.activo ? 'bg-success' : 'bg-secondary'">
                        {{ categoria.activo ? 'Sí' : 'No' }}
                      </span><br>
                      <strong>Creado:</strong> {{ formatearFecha(categoria.created_at) }}
                    </p>
                    <div class="btn-group btn-group-sm">
                      <button 
                        class="btn btn-outline-info btn-sm"
                        (click)="verDetalles(categoria)">
                        <i class="bi bi-eye"></i> Ver
                      </button>
                      <button 
                        class="btn btn-outline-danger btn-sm"
                        (click)="eliminarCategoria(categoria.id!)">
                        <i class="bi bi-trash"></i> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sin Resultados -->
          <div *ngIf="categorias.length === 0 && !cargando && !error" class="alert alert-warning">
            <h5><i class="bi bi-info-circle"></i> Sin Categorías</h5>
            <p class="mb-0">No se encontraron categorías en la base de datos.</p>
            <button class="btn btn-primary mt-2" (click)="crearCategoriaEjemplo()">
              Crear Categoría de Ejemplo
            </button>
          </div>

          <!-- Información de Conexión -->
          <div class="mt-4">
            <h5>🔗 Información de Conexión</h5>
            <div class="bg-light p-3 rounded">
              <p class="mb-1"><strong>Tabla:</strong> {{ nombreTabla }}</p>
              <p class="mb-1"><strong>Última Actualización:</strong> {{ ultimaActualizacion | date:'medium' }}</p>
              <p class="mb-0"><strong>Estado:</strong> 
                <span class="badge bg-success">Conectado a Supabase</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }
    
    .btn-group-sm .btn {
      font-size: 0.75rem;
    }
    
    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }
    
    .bg-light {
      background-color: #f8f9fa !important;
    }
  `]
})
export class TestCategoriasComponent implements OnInit {
  
  // 🔧 SERVICIOS
  private categoriaService = inject(CategoriaService);
  
  // 📊 PROPIEDADES
  categorias: Categoria[] = [];
  cargando = false;
  error: string | null = null;
  nombreTabla = 'categorias';
  ultimaActualizacion = new Date();

  ngOnInit() {
    console.log('🧪 Iniciando componente de prueba de categorías');
    this.cargarCategorias();
  }

  /**
   * Carga las categorías desde Supabase
   */
  cargarCategorias() {
    this.cargando = true;
    this.error = null;
    console.log('📂 Cargando categorías desde Supabase...');

    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorías cargadas exitosamente:', categorias);
        this.categorias = categorias;
        this.ultimaActualizacion = new Date();
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error cargando categorías:', error);
        this.error = `Error al cargar categorías: ${error.message || error}`;
        this.cargando = false;
      }
    });
  }

  /**
   * Crea una categoría de ejemplo para probar
   */
  async crearCategoriaEjemplo() {
    this.cargando = true;
    this.error = null;
    
    const nombreEjemplo = `Categoría Ejemplo ${Date.now()}`;
    
    try {
      console.log('➕ Creando categoría de ejemplo:', nombreEjemplo);
      await this.categoriaService.crearCategoria(nombreEjemplo);
      console.log('✅ Categoría de ejemplo creada');
      
      // Recargar categorías
      this.cargarCategorias();
    } catch (error: any) {
      console.error('❌ Error creando categoría:', error);
      this.error = `Error al crear categoría: ${error.message || error}`;
      this.cargando = false;
    }
  }

  /**
   * Elimina una categoría (soft delete)
   */
  async eliminarCategoria(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      console.log('🗑️ Eliminando categoría:', id);
      await this.categoriaService.eliminarCategoria(id);
      console.log('✅ Categoría eliminada');
      
      // Recargar categorías
      this.cargarCategorias();
    } catch (error: any) {
      console.error('❌ Error eliminando categoría:', error);
      this.error = `Error al eliminar categoría: ${error.message || error}`;
    }
  }

  /**
   * Muestra detalles de una categoría
   */
  verDetalles(categoria: Categoria) {
    alert(`
      DETALLES DE LA CATEGORÍA:
      
      ID: ${categoria.id}
      Nombre: ${categoria.nombre}
      Descripción: ${categoria.descripcion || 'Sin descripción'}
      Activo: ${categoria.activo ? 'Sí' : 'No'}
      Creado: ${this.formatearFecha(categoria.created_at)}
      Actualizado: ${this.formatearFecha(categoria.updated_at)}
    `);
  }

  /**
   * Limpia los resultados
   */
  limpiarResultados() {
    this.categorias = [];
    this.error = null;
    console.log('🧹 Resultados limpiados');
  }

  /**
   * Formatea una fecha para mostrar
   */
  formatearFecha(fecha?: string): string {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleString('es-AR');
  }
}
