// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

// Servicios de Firebase/Firestore (usando el servicio existente)
import { GestionProductosService, Producto } from '../../servicios/gestion-productos.service';
import { CategoriaService, Categoria } from '../../servicios/categoria.service';
import { GeminiIAService, ResultadoAnalisisGemini } from '../../servicios/gemini-ia.service';

// --- INTERFACES Y TIPOS ---
// Usamos las interfaces de los servicios reales

/**
 * ============================================================================
 * COMPONENTE DE GESTIÓN DE PRODUCTOS - PANEL DE ADMINISTRACIÓN
 * ============================================================================
 * 
 * Este componente permite a los administradores gestionar el catálogo completo
 * de productos del e-commerce ALED2025. Proporciona una interfaz completa para
 * crear, editar, eliminar y organizar productos del sistema.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - CRUD completo de productos (Crear, Leer, Actualizar, Eliminar)
 * - Gestión de categorías dinámicas
 * - Filtros y búsqueda de productos
 * - Validaciones en tiempo real
 * - Interfaz moderna y responsiva
 * - Datos de demostración para pruebas
 * 
 * TECNOLOGÍAS UTILIZADAS:
 * - Angular Signals para estado reactivo
 * - Angular Reactive Forms para validaciones
 * - SweetAlert2 para notificaciones elegantes
 * - Bootstrap para diseño responsivo
 * - TypeScript para tipado fuerte
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */
@Component({
  selector: 'app-gestion-productos',
  standalone: true, // Componente independiente para mejor tree-shaking
  imports: [
    CommonModule,              // Directivas básicas de Angular (*ngIf, *ngFor, etc.)
    FormsModule,              // Para formularios template-driven
    ReactiveFormsModule,      // Para formularios reactivos
    HttpClientModule          // Para peticiones HTTP a Gemini AI
  ],
  template: `
    <div class="container-fluid py-4">
      <!-- Header del componente -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-box-seam me-2"></i>
                Gestión de Productos
              </h2>
              <p class="text-muted mb-0">
                Administra el catálogo completo de productos
              </p>
            </div>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-success"
                (click)="mostrarFormularioNuevo()">
                <i class="bi bi-plus-circle me-1"></i>
                Nuevo Producto
              </button>
              <button 
                class="btn btn-outline-primary"
                (click)="generarProductosPrueba()">
                <i class="bi bi-database me-1"></i>
                Datos de Prueba
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Total Productos</h6>
                  <h3 class="mb-0">{{ estadisticas().totalProductos }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-box-seam fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Activos</h6>
                  <h3 class="mb-0">{{ estadisticas().activos }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-check-circle fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-warning text-dark">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Destacados</h6>
                  <h3 class="mb-0">{{ estadisticas().destacados }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-star fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <h6 class="card-title">Categorías</h6>
                  <h3 class="mb-0">{{ estadisticas().categorias }}</h3>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-tags fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Formulario de Producto -->
      <div *ngIf="mostrandoFormulario()" class="row mb-4">
        <div class="col-12">
          <div class="card border-primary">
            <div class="card-header bg-primary text-white">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-0">
                    <i class="bi bi-plus-circle me-2"></i>
                    {{ productoEditando() ? 'Editar Producto' : 'Nuevo Producto' }}
                  </h5>
                  <!-- Indicador de análisis en progreso -->
                  <small class="text-light" *ngIf="analizandoImagen()">
                    <i class="bi bi-stars me-1"></i>
                    Gemini 2.0 Flash analizando imagen...
                  </small>
                </div>
                <button 
                  type="button" 
                  class="btn btn-outline-light btn-sm"
                  (click)="cancelarFormulario()"
                  [disabled]="analizandoImagen()">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div class="card-body">
              <form [formGroup]="formularioProducto" (ngSubmit)="guardarProducto()">
                <div class="row">
                  <!-- Información básica -->
                  <div class="col-md-6">
                    <h6 class="text-primary mb-3">
                      <i class="bi bi-info-circle me-1"></i>
                      Información Básica
                    </h6>
                    
                    <!-- Nombre del producto -->
                    <div class="mb-3">
                      <label class="form-label">Nombre del Producto *</label>
                      <div class="input-group">
                        <input 
                          type="text" 
                          class="form-control"
                          formControlName="nombre"
                          placeholder="Ej: Smartphone Samsung Galaxy A54"
                          [class.is-invalid]="formularioProducto.get('nombre')?.invalid && formularioProducto.get('nombre')?.touched">
                        <button 
                          type="button" 
                          class="btn btn-outline-secondary"
                          (click)="generarNombreIA()"
                          title="Generar nombre con IA">
                          <i class="bi bi-magic"></i>
                        </button>
                      </div>
                      <div class="invalid-feedback" *ngIf="formularioProducto.get('nombre')?.invalid && formularioProducto.get('nombre')?.touched">
                        El nombre del producto es requerido
                      </div>
                    </div>

                    <!-- Categoría -->
                    <div class="mb-3">
                      <label class="form-label">Categoría *</label>
                      <select 
                        class="form-select"
                        formControlName="categoria"
                        [class.is-invalid]="formularioProducto.get('categoria')?.invalid && formularioProducto.get('categoria')?.touched">
                        <option value="">Seleccionar categoría</option>
                        <option value="Electrónicos">Electrónicos</option>
                        <option value="Ropa">Ropa</option>
                        <option value="Hogar">Hogar</option>
                        <option value="Deportes">Deportes</option>
                        <option value="Libros">Libros</option>
                        <option value="Juguetes">Juguetes</option>
                        <option value="Belleza">Belleza</option>
                        <option value="Automotriz">Automotriz</option>
                      </select>
                      <div class="invalid-feedback" *ngIf="formularioProducto.get('categoria')?.invalid && formularioProducto.get('categoria')?.touched">
                        Selecciona una categoría
                      </div>
                    </div>

                    <!-- Precio y Stock -->
                    <div class="row">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">Precio (ARS) *</label>
                          <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input 
                              type="number" 
                              class="form-control"
                              formControlName="precio"
                              placeholder="0"
                              min="0"
                              step="0.01"
                              [class.is-invalid]="formularioProducto.get('precio')?.invalid && formularioProducto.get('precio')?.touched">
                          </div>
                          <div class="invalid-feedback" *ngIf="formularioProducto.get('precio')?.invalid && formularioProducto.get('precio')?.touched">
                            Ingresa un precio válido
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">Stock Inicial *</label>
                          <input 
                            type="number" 
                            class="form-control"
                            formControlName="stock"
                            placeholder="0"
                            min="0"
                            [class.is-invalid]="formularioProducto.get('stock')?.invalid && formularioProducto.get('stock')?.touched">
                          <div class="invalid-feedback" *ngIf="formularioProducto.get('stock')?.invalid && formularioProducto.get('stock')?.touched">
                            Ingresa un stock válido
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Imagen del producto -->
                    <div class="mb-3">
                      <label class="form-label">Imagen del Producto</label>
                      
                      <!-- Subida de imagen simplificada -->
                      <div class="mb-2">
                        <small class="text-muted">
                          <i class="bi bi-info-circle me-1"></i>
                          Sube una imagen y la IA completará automáticamente el formulario
                        </small>
                      </div>

                      <!-- Subir archivo simplificado -->
                      <div class="mb-2">
                        <input 
                          type="file" 
                          class="form-control"
                          accept="image/*"
                          (change)="onImagenSeleccionada($event)"
                          #fileInput
                          [disabled]="analizandoImagen()">
                        
                        <!-- Estado del análisis -->
                        <div class="mt-2" *ngIf="analizandoImagen()">
                          <div class="d-flex align-items-center text-primary">
                            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                            <small><strong>🤖 Analizando imagen con Gemini AI...</strong></small>
                          </div>
                          <div class="progress mt-1" style="height: 4px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated bg-gradient" style="width: 100%"></div>
                          </div>
                        </div>
                        
                        <small class="form-text text-success" *ngIf="imagenSeleccionada() && !analizandoImagen()">
                          <i class="bi bi-check-circle me-1"></i>
                          ¡Imagen analizada! El formulario se completó automáticamente.
                        </small>
                      </div>

                      
                      <!-- Estado de configuración de Gemini -->
                      <div class="mt-2">
                        <div *ngIf="!geminiService.esApiConfigurada()" class="alert alert-warning alert-sm py-2">
                          <i class="bi bi-exclamation-triangle me-1"></i>
                          <small>Gemini AI no configurado. Usando modo simulación.</small>
                        </div>
                        <div *ngIf="geminiService.esApiConfigurada()" class="d-flex align-items-center gap-2 flex-wrap">
                          <small class="text-success">
                            <i class="bi bi-check-circle me-1"></i>
                            Gemini AI configurado
                          </small>
                          
                          <!-- Botón principal de diagnóstico -->
                          <button 
                            type="button" 
                            class="btn btn-outline-info btn-sm"
                            (click)="probarConexionGemini()"
                            [disabled]="probandoConexion()">
                            <span *ngIf="probandoConexion()" class="spinner-border spinner-border-sm me-1"></span>
                            <i *ngIf="!probandoConexion()" class="bi bi-wifi me-1"></i>
                            {{ probandoConexion() ? 'Probando...' : 'Probar IA' }}
                          </button>
                          
                          <!-- Botones adicionales colapsables -->
                          <div class="dropdown">
                            <button 
                              class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                              type="button" 
                              data-bs-toggle="dropdown">
                              <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu">
                              <li>
                                <button 
                                  class="dropdown-item" 
                                  type="button"
                                  (click)="listarModelosGemini()"
                                  [disabled]="probandoConexion()">
                                  <i class="bi bi-list me-2"></i>
                                  Ver modelos disponibles
                                </button>
                              </li>
                              <li>
                                <button 
                                  class="dropdown-item" 
                                  type="button"
                                  (click)="probarModelosSimples()"
                                  [disabled]="probandoConexion()">
                                  <i class="bi bi-tools me-2"></i>
                                  Diagnóstico completo
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Descripción y configuración -->
                  <div class="col-md-6">
                    <h6 class="text-primary mb-3">
                      <i class="bi bi-card-text me-1"></i>
                      Descripción y Configuración
                    </h6>

                    <!-- Descripción -->
                    <div class="mb-3">
                      <label class="form-label">Descripción del Producto</label>
                      <div class="position-relative">
                        <textarea 
                          class="form-control"
                          formControlName="descripcion"
                          rows="4"
                          placeholder="Describe las características principales del producto..."
                          maxlength="500"></textarea>
                        <button 
                          type="button" 
                          class="btn btn-primary btn-sm position-absolute"
                          style="top: 8px; right: 8px;"
                          (click)="generarDescripcionIA()"
                          title="Generar descripción con IA">
                          <i class="bi bi-magic me-1"></i>
                          IA
                        </button>
                      </div>
                      <div class="form-text">
                        {{ formularioProducto.get('descripcion')?.value?.length || 0 }}/500 caracteres
                      </div>
                    </div>

                    <!-- Configuraciones adicionales - Colapsable -->
                    <div class="mb-3">
                      <button 
                        class="btn btn-link p-0 text-decoration-none" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#configuracionesAvanzadas">
                        <i class="bi bi-gear me-1"></i>
                        <small>Configuraciones Avanzadas</small>
                        <i class="bi bi-chevron-down ms-1"></i>
                      </button>
                      
                      <div class="collapse mt-2" id="configuracionesAvanzadas">
                        <div class="card card-body py-2">
                          <div class="form-check mb-2">
                            <input 
                              class="form-check-input" 
                              type="checkbox" 
                              formControlName="activo"
                              id="checkActivo">
                            <label class="form-check-label" for="checkActivo">
                              <i class="bi bi-eye me-1"></i>
                              <small>Producto activo (visible en la tienda)</small>
                            </label>
                          </div>
                          <div class="form-check">
                            <input 
                              class="form-check-input" 
                              type="checkbox" 
                              formControlName="esDestacado"
                              id="checkDestacado">
                            <label class="form-check-label" for="checkDestacado">
                              <i class="bi bi-star me-1"></i>
                              <small>Producto destacado (aparece en inicio)</small>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Vista previa de imagen -->
                    <div class="mb-3" *ngIf="formularioProducto.get('imagen')?.value">
                      <label class="form-label">Vista Previa</label>
                      <div class="text-center">
                        <img 
                          [src]="formularioProducto.get('imagen')?.value" 
                          alt="Vista previa"
                          class="img-thumbnail"
                          style="max-width: 200px; max-height: 150px; object-fit: cover;"
                          (error)="$event.target.src='https://via.placeholder.com/200x150/ccc/999?text=Error+de+Imagen'">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botones de acción -->
                <div class="row mt-4">
                  <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                      <!-- Botón limpiar a la izquierda -->
                      <button 
                        type="button" 
                        class="btn btn-outline-secondary btn-sm"
                        (click)="limpiarFormulario()"
                        title="Limpiar formulario">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Limpiar
                      </button>
                      
                      <!-- Botones principales a la derecha -->
                      <div class="d-flex gap-2">
                        <button 
                          type="button" 
                          class="btn btn-outline-secondary"
                          (click)="cancelarFormulario()">
                          <i class="bi bi-x-circle me-1"></i>
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          class="btn btn-success"
                          [disabled]="formularioProducto.invalid || guardandoProducto() || analizandoImagen()">
                          <span *ngIf="guardandoProducto()" class="spinner-border spinner-border-sm me-1"></span>
                          <span *ngIf="analizandoImagen()" class="spinner-border spinner-border-sm me-1"></span>
                          <i *ngIf="!guardandoProducto() && !analizandoImagen()" class="bi bi-check-circle me-1"></i>
                          <i *ngIf="analizandoImagen()" class="bi bi-stars me-1"></i>
                          {{ analizandoImagen() ? 'Analizando...' : guardandoProducto() ? 'Guardando...' : (productoEditando() ? 'Actualizar' : 'Crear') + ' Producto' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de productos -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-list-ul me-2"></i>
                Lista de Productos
                <span class="badge bg-primary ms-2">{{ productos().length }}</span>
              </h5>
            </div>
            <div class="card-body">
              <!-- Sin productos -->
              <div *ngIf="productos().length === 0" class="text-center py-4">
                <i class="bi bi-inbox display-1 text-muted"></i>
                <h4 class="mt-3">No hay productos</h4>
                <p class="text-muted">
                  Aún no se han creado productos en el sistema.
                </p>
                <button 
                  class="btn btn-primary"
                  (click)="generarProductosPrueba()">
                  <i class="bi bi-plus-circle me-1"></i>
                  Generar Productos de Prueba
                </button>
              </div>

              <!-- Tabla de productos -->
              <div *ngIf="productos().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let producto of productos()">
                      <td>
                        <img 
                          [src]="producto.imagen || 'https://via.placeholder.com/50x50/ccc/999?text=Sin+Imagen'" 
                          [alt]="producto.nombre"
                          class="img-thumbnail"
                          style="width: 50px; height: 50px; object-fit: cover;">
                      </td>
                      <td>
                        <div>
                          <strong>{{ producto.nombre }}</strong>
                          <br>
                          <small class="text-muted">{{ (producto.descripcion || 'Sin descripción') | slice:0:50 }}...</small>
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-secondary">{{ producto.categoria }}</span>
                      </td>
                      <td>
                        <strong class="text-success">
                          {{ producto.precio | currency:'ARS':'symbol':'1.0-0' }}
                        </strong>
                      </td>
                      <td>
                        <span [class]="'badge ' + ((producto.stock || 0) > 0 ? 'bg-success' : 'bg-danger')">
                          {{ producto.stock || 0 }}
                        </span>
                      </td>
                      <td>
                        <div class="d-flex flex-column gap-1">
                          <span [class]="'badge ' + (producto.activo ? 'bg-success' : 'bg-secondary')">
                            {{ producto.activo ? 'Activo' : 'Inactivo' }}
                          </span>
                          <span *ngIf="producto.esDestacado" class="badge bg-warning text-dark">
                            Destacado
                          </span>
                        </div>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button 
                            class="btn btn-outline-primary"
                            (click)="editarProducto(producto)"
                            title="Editar producto">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button 
                            class="btn btn-outline-danger"
                            (click)="eliminarProducto(producto)"
                            title="Eliminar producto">
                            <i class="bi bi-trash"></i>
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
      </div>
    </div>
  `,
  styles: [`
    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
      background-color: #f8f9fa;
    }
    
    .btn-group-sm .btn {
      padding: 0.25rem 0.5rem;
    }
    
    .badge {
      font-size: 0.75em;
    }
    
    .card {
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
      border: 1px solid rgba(0, 0, 0, 0.125);
    }

    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid rgba(0, 0, 0, 0.125);
    }
    
    .progress {
      height: 8px;
    }
    
    .btn-check:checked + .btn-outline-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
      color: white;
    }
    
    .bg-gradient {
      background: linear-gradient(45deg, #0d6efd, #6f42c1, #d63384);
    }
    
    .alert-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
    
    /* Estilos para el modal de resultados */
    .swal-wide {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .swal-wide .badge {
      font-size: 0.75rem;
    }
    
    .swal-wide .card {
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class GestionProductos implements OnInit {

  // --- INYECCIÓN DE SERVICIOS ---
  private productosService = inject(GestionProductosService);
  private categoriasService = inject(CategoriaService);
  public geminiService = inject(GeminiIAService); // Público para acceso desde template
  private fb = inject(FormBuilder);

  // --- PROPIEDADES DEL COMPONENTE ---

  /**
   * Signal que contiene la lista completa de productos.
   * Se actualiza automáticamente cuando se modifican los datos.
   */
  productos = signal<Producto[]>([]);

  /**
   * Signal que contiene la lista de categorías disponibles.
   * Se usa para filtros y formularios.
   */
  categorias = signal<Categoria[]>([]);

  /**
   * Signal que controla si se muestra el formulario de producto.
   */
  mostrandoFormulario = signal<boolean>(false);

  /**
   * Signal que indica si se está guardando un producto.
   */
  guardandoProducto = signal<boolean>(false);

  /**
   * Signal que contiene el producto que se está editando (null si es nuevo).
   */
  productoEditando = signal<Producto | null>(null);

  /**
   * Signal que indica si se está analizando una imagen con IA.
   */
  analizandoImagen = signal<boolean>(false);

  /**
   * Signal que contiene la imagen seleccionada para análisis.
   */
  imagenSeleccionada = signal<File | null>(null);

  /**
   * Tipo de imagen seleccionado (archivo o URL).
   */
  tipoImagen: 'archivo' | 'url' = 'archivo';

  /**
   * Signal que indica si se está probando la conexión con Gemini.
   */
  probandoConexion = signal<boolean>(false);

  /**
   * Formulario reactivo para crear/editar productos.
   */
  formularioProducto: FormGroup;

  // --- COMPUTED SIGNALS (Señales Computadas) ---

  /**
   * Computed Signal que calcula estadísticas de los productos.
   * Proporciona contadores para las tarjetas de resumen.
   */
  estadisticas = computed(() => {
    const todos = this.productos();
    const categoriasUnicas = new Set(todos.map(p => p.categoria));
    
    return {
      totalProductos: todos.length,
      activos: todos.filter(p => p.activo).length,
      destacados: todos.filter(p => p.esDestacado).length,
      categorias: categoriasUnicas.size
    };
  });

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---

  /**
   * Constructor del componente.
   * Inicializa el formulario reactivo.
   */
  constructor() {
    this.formularioProducto = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      categoria: ['', [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0)]],
      imagen: [''],
      activo: [true],
      esDestacado: [false]
    });
  }

  /**
   * Método que se ejecuta automáticamente cuando el componente se inicializa.
   * Aquí cargamos los datos iniciales.
   */
  ngOnInit(): void {
    // Cargar datos iniciales
    this.cargarCategorias();
    this.cargarProductos();
  }

  // --- MÉTODOS DE GESTIÓN DE DATOS ---

  /**
   * Carga las categorías disponibles desde Firestore.
   */
  cargarCategorias(): void {
    console.log('📂 Cargando categorías desde Firestore...');
    
    this.categoriasService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorías cargadas:', categorias.length);
        this.categorias.set(categorias);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
      }
    });
  }

  /**
   * Carga los productos existentes desde Firestore.
   */
  cargarProductos(): void {
    console.log('📦 [ADMIN] Iniciando carga de productos desde Firestore...');
    
    this.productosService.obtenerProductos().subscribe({
      next: (productos) => {
        console.log('✅ [ADMIN] Productos recibidos del servicio:', productos.length);
        console.log('📋 [ADMIN] Lista de productos:', productos);
        
        this.productos.set(productos);
        
        if (productos.length === 0) {
          console.log('⚠️ [ADMIN] No se encontraron productos en Firestore');
          Swal.fire({
            icon: 'info',
            title: 'Sin productos',
            text: 'No se encontraron productos en la base de datos',
            confirmButtonText: 'Entendido'
          });
        } else {
          console.log(`🎉 [ADMIN] ${productos.length} productos cargados exitosamente`);
        }
      },
      error: (error) => {
        console.error('❌ [ADMIN] Error al cargar productos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudieron cargar los productos desde Firestore',
          footer: `Error: ${error.message || error}`
        });
      }
    });
  }

  /**
   * Genera productos de demostración para mostrar la funcionalidad.
   * Útil para pruebas y demostraciones del sistema.
   */
  generarProductosPrueba(): void {
    const productosDemo: Producto[] = [
      {
        id: 'PROD-001',
        nombre: 'Smartphone Samsung Galaxy A54',
        descripcion: 'Teléfono inteligente con pantalla AMOLED de 6.4 pulgadas, cámara triple de 50MP y 128GB de almacenamiento.',
        precio: 89999,
        categoria: 'Electrónicos',
        stock: 15,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Samsung+Galaxy',
        activo: true,
        esDestacado: true
      },
      {
        id: 'PROD-002',
        nombre: 'Notebook Lenovo ThinkPad E14',
        descripcion: 'Laptop empresarial con procesador Intel Core i5, 8GB RAM, SSD 256GB. Perfecta para trabajo profesional.',
        precio: 125000,
        categoria: 'Electrónicos',
        stock: 8,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Lenovo+ThinkPad',
        activo: true,
        esDestacado: true
      },
      {
        id: 'PROD-003',
        nombre: 'Remera Deportiva Nike Dri-FIT',
        descripcion: 'Camiseta deportiva de alta calidad con tecnología Dri-FIT para máximo rendimiento.',
        precio: 8500,
        categoria: 'Ropa',
        stock: 25,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Nike+Dri-FIT',
        activo: true,
        esDestacado: false
      },
      {
        id: 'PROD-004',
        nombre: 'Cafetera Automática Philips 3200',
        descripcion: 'Cafetera espresso automática con molinillo integrado y sistema de espuma de leche.',
        precio: 45000,
        categoria: 'Hogar',
        stock: 12,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Cafetera+Philips',
        activo: true,
        esDestacado: false
      },
      {
        id: 'PROD-005',
        nombre: 'Zapatillas Running Adidas Ultraboost',
        descripcion: 'Calzado deportivo con tecnología Boost para máximo confort y rendimiento.',
        precio: 22000,
        categoria: 'Deportes',
        stock: 18,
        imagen: 'https://via.placeholder.com/300x200/0077b6/ffffff?text=Adidas+Boost',
        activo: true,
        esDestacado: true
      }
    ];

    // Crear productos en Firestore
    console.log('🔄 Creando productos de demostración en Firestore...');
    
    let productosCreados = 0;
    const totalProductos = productosDemo.length;

    productosDemo.forEach((producto) => {
      this.productosService.crearProducto(producto).subscribe({
        next: (id) => {
          productosCreados++;
          console.log(`✅ Producto creado: ${producto.nombre} (ID: ${id})`);
          
          if (productosCreados === totalProductos) {
            // Recargar la lista cuando se hayan creado todos
            this.cargarProductos();
            
            Swal.fire({
              icon: 'success',
              title: '¡Datos generados!',
              text: `Se crearon ${totalProductos} productos de demostración en Firestore`,
              timer: 2000,
              showConfirmButton: false
            });
          }
        },
        error: (error) => {
          console.error(`❌ Error creando producto ${producto.nombre}:`, error);
          Swal.fire('Error', `No se pudo crear el producto ${producto.nombre}`, 'error');
        }
      });
    });
  }

  // --- MÉTODOS DE FORMULARIO ---

  /**
   * Muestra el formulario para crear un nuevo producto.
   */
  mostrarFormularioNuevo(): void {
    this.productoEditando.set(null);
    this.limpiarFormulario();
    this.mostrandoFormulario.set(true);
    
    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('.card.border-primary')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  /**
   * Prepara el formulario para editar un producto existente.
   * 
   * @param producto - El producto a editar
   */
  editarProducto(producto: Producto): void {
    this.productoEditando.set(producto);
    
    // Cargar datos del producto en el formulario
    this.formularioProducto.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      categoria: producto.categoria,
      stock: producto.stock,
      imagen: producto.imagen || '',
      activo: producto.activo,
      esDestacado: producto.esDestacado
    });
    
    this.mostrandoFormulario.set(true);
    
    // Scroll al formulario
    setTimeout(() => {
      document.querySelector('.card.border-primary')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }

  /**
   * Elimina un producto después de confirmación.
   * 
   * @param producto - El producto a eliminar
   */
  async eliminarProducto(producto: Producto): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el producto "${producto.nombre}" permanentemente`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed && producto.id) {
      console.log(`🗑️ Eliminando producto: ${producto.nombre} (ID: ${producto.id})`);
      
      this.productosService.eliminarProducto(producto.id).subscribe({
        next: () => {
          console.log(`✅ Producto eliminado: ${producto.nombre}`);
          
          // Recargar la lista de productos
          this.cargarProductos();
          
          // Mostrar confirmación
          Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: `El producto "${producto.nombre}" ha sido eliminado de Firestore`,
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error(`❌ Error eliminando producto ${producto.nombre}:`, error);
          Swal.fire('Error', `No se pudo eliminar el producto ${producto.nombre}`, 'error');
        }
      });
    }
  }

  // --- MÉTODOS DEL FORMULARIO ---

  /**
   * Guarda un producto (crear nuevo o actualizar existente).
   */
  async guardarProducto(): Promise<void> {
    if (this.formularioProducto.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.formularioProducto.controls).forEach(key => {
        this.formularioProducto.get(key)?.markAsTouched();
      });
      return;
    }

    this.guardandoProducto.set(true);

    try {
      const datosProducto = this.formularioProducto.value;
      const productoEditando = this.productoEditando();

      if (productoEditando && productoEditando.id) {
        // Actualizar producto existente
        console.log('🔄 Actualizando producto:', datosProducto.nombre);
        
        this.productosService.actualizarProducto(productoEditando.id, datosProducto).subscribe({
          next: () => {
            console.log('✅ Producto actualizado:', datosProducto.nombre);
            this.cargarProductos();
            this.cancelarFormulario();
            
            Swal.fire({
              icon: 'success',
              title: '¡Producto actualizado!',
              text: `El producto "${datosProducto.nombre}" ha sido actualizado correctamente`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Error actualizando producto:', error);
            Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
          },
          complete: () => {
            this.guardandoProducto.set(false);
          }
        });
      } else {
        // Crear nuevo producto
        console.log('➕ Creando nuevo producto:', datosProducto.nombre);
        
        this.productosService.crearProducto(datosProducto).subscribe({
          next: (id) => {
            console.log('✅ Producto creado:', datosProducto.nombre, 'ID:', id);
            this.cargarProductos();
            this.cancelarFormulario();
            
            Swal.fire({
              icon: 'success',
              title: '¡Producto creado!',
              text: `El producto "${datosProducto.nombre}" ha sido creado correctamente`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Error creando producto:', error);
            Swal.fire('Error', 'No se pudo crear el producto', 'error');
          },
          complete: () => {
            this.guardandoProducto.set(false);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error en guardarProducto:', error);
      this.guardandoProducto.set(false);
      Swal.fire('Error', 'Ocurrió un error inesperado', 'error');
    }
  }

  /**
   * Cancela la edición/creación y oculta el formulario.
   */
  cancelarFormulario(): void {
    this.mostrandoFormulario.set(false);
    this.productoEditando.set(null);
    this.limpiarFormulario();
  }

  /**
   * Limpia todos los campos del formulario.
   */
  limpiarFormulario(): void {
    this.formularioProducto.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: '',
      stock: 0,
      imagen: '',
      activo: true,
      esDestacado: false
    });
    
    // Limpiar imagen seleccionada
    this.imagenSeleccionada.set(null);
    this.tipoImagen = 'archivo';
  }

  // --- MÉTODOS DE GESTIÓN DE IMÁGENES ---

  /**
   * Maneja la selección de una imagen desde el input file y analiza automáticamente.
   */
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.imagenSeleccionada.set(file);
      
      // Convertir a base64 para vista previa
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formularioProducto.patchValue({ imagen: e.target.result });
        
        // Mostrar notificación de inicio de análisis
        Swal.fire({
          icon: 'success',
          title: '📸 ¡Imagen cargada!',
          text: 'Iniciando análisis automático con Gemini 2.0 Flash...',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
        // Iniciar análisis automático después de un breve delay
        setTimeout(() => {
          this.analizarImagenAutomaticamente(e.target.result, file.type);
        }, 500);
      };
      reader.readAsDataURL(file);
      
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Archivo inválido',
        text: 'Por favor selecciona un archivo de imagen válido (JPG, PNG, GIF, etc.)',
        confirmButtonText: 'Entendido'
      });
    }
  }

  /**
   * Maneja el cambio de URL de imagen y analiza automáticamente.
   */
  onUrlImagenCambiada(): void {
    const url = this.formularioProducto.get('imagen')?.value;
    if (url && this.esUrlImagenValida(url)) {
      // Mostrar notificación de inicio de análisis
      Swal.fire({
        icon: 'success',
        title: '🔗 ¡URL detectada!',
        text: 'Iniciando análisis automático de la imagen...',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
      
      // Iniciar análisis automático después de un breve delay
      setTimeout(() => {
        this.analizarImagenUrlAutomaticamente(url);
      }, 500);
    }
  }

  /**
   * Analiza automáticamente una imagen cargada como archivo.
   */
  private async analizarImagenAutomaticamente(imagenBase64: string, tipoMime: string): Promise<void> {
    await this.procesarAnalisisConGemini(imagenBase64, tipoMime);
  }

  /**
   * Analiza automáticamente una imagen desde URL.
   */
  private async analizarImagenUrlAutomaticamente(url: string): Promise<void> {
    try {
      // Convertir URL a base64
      const response = await fetch(url);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const imagenBase64 = e.target.result;
        await this.procesarAnalisisConGemini(imagenBase64, blob.type);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar imagen',
        text: 'No se pudo cargar la imagen desde la URL proporcionada',
        confirmButtonText: 'Entendido',
        toast: true,
        position: 'top-end',
        timer: 3000
      });
    }
  }

  /**
   * Valida si una URL es de imagen.
   */
  private esUrlImagenValida(url: string): boolean {
    const extensionesImagen = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return extensionesImagen.some(ext => url.toLowerCase().includes(ext));
  }

  /**
   * Analiza una imagen cargada como archivo con Gemini AI.
   */
  async analizarImagenConGemini(): Promise<void> {
    const imagen = this.imagenSeleccionada();
    if (!imagen) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay imagen',
        text: 'Primero selecciona una imagen para analizar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Convertir imagen a base64
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const imagenBase64 = e.target.result;
      await this.procesarAnalisisConGemini(imagenBase64, imagen.type);
    };
    reader.readAsDataURL(imagen);
  }

  /**
   * Analiza una imagen desde URL con Gemini AI.
   */
  async analizarImagenUrlConGemini(): Promise<void> {
    const url = this.formularioProducto.get('imagen')?.value;
    if (!url || !this.esUrlImagenValida(url)) {
      Swal.fire({
        icon: 'warning',
        title: 'URL inválida',
        text: 'Ingresa una URL válida de imagen para analizar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      // Convertir URL a base64
      const response = await fetch(url);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const imagenBase64 = e.target.result;
        await this.procesarAnalisisConGemini(imagenBase64, blob.type);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar imagen',
        text: 'No se pudo cargar la imagen desde la URL proporcionada',
        confirmButtonText: 'Entendido'
      });
    }
  }

  /**
   * Procesa el análisis de imagen con Gemini AI real.
   */
  private async procesarAnalisisConGemini(imagenBase64: string, tipoMime: string): Promise<void> {
    this.analizandoImagen.set(true);

    console.log('🎯 INICIANDO ANÁLISIS REAL CON GEMINI');
    console.log('📊 Estado API configurada:', this.geminiService.esApiConfigurada());
    console.log('🖼️ Tamaño imagen base64:', imagenBase64.length);
    console.log('📋 Tipo MIME:', tipoMime);

    // Mostrar progreso de análisis con Gemini
    Swal.fire({
      title: 'Analizando imagen con Gemini AI...',
      html: `
        <div class="text-center">
          <div class="d-flex justify-content-center mb-3">
            <div class="spinner-border text-primary me-2" role="status"></div>
            <i class="bi bi-stars fs-3 text-warning"></i>
          </div>
          <p class="mb-2"><strong>Gemini está analizando tu imagen...</strong></p>
          <div class="progress mb-2">
            <div class="progress-bar progress-bar-striped progress-bar-animated bg-gradient" style="width: 50%"></div>
          </div>
          <small class="text-muted">Detectando objetos, categorías y generando contenido</small>
          <br><small class="text-info">Revisa la consola (F12) para logs detallados</small>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false
    });

    try {
      // Llamar a Gemini AI para análisis real
      this.geminiService.analizarImagenProducto(imagenBase64, tipoMime).subscribe({
        next: (resultado: ResultadoAnalisisGemini) => {
          console.log('🎉 RESULTADO RECIBIDO:', resultado);
          console.log('🔍 Confianza:', resultado.confianza);
          console.log('📝 Observaciones:', resultado.observaciones);
          
          this.analizandoImagen.set(false);
          this.aplicarResultadosGemini(resultado);
          
          // Verificar si es resultado real o fallback
          if (resultado.confianza < 0.5 || resultado.nombre === 'Producto Detectado por IA') {
            console.warn('⚠️ RESULTADO ES FALLBACK - Gemini no funcionó correctamente');
            this.mostrarErrorAnalisis(resultado);
          } else {
            console.log('✅ RESULTADO REAL DE GEMINI - Análisis exitoso');
            this.mostrarResultadosAnalisis(resultado);
          }
        },
        error: (error) => {
          console.error('Error en análisis con Gemini:', error);
          this.analizandoImagen.set(false);
          
          // Mostrar error pero ofrecer alternativa
          Swal.fire({
            icon: 'warning',
            title: 'Error en análisis con Gemini',
            html: `
              <p>No se pudo conectar con Gemini AI.</p>
              <p class="text-muted">Esto puede deberse a:</p>
              <ul class="text-start text-muted">
                <li>API Key no configurada</li>
                <li>Problema de conectividad</li>
                <li>Límite de cuota excedido</li>
              </ul>
            `,
            showCancelButton: true,
            confirmButtonText: 'Usar modo simulación',
            cancelButtonText: 'Cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              // Usar análisis simulado como fallback
              const resultadoFallback = this.geminiService['generarRespuestaFallback']();
              this.aplicarResultadosGemini(resultadoFallback);
            }
          });
        }
      });
    } catch (error) {
      this.analizandoImagen.set(false);
      console.error('Error procesando imagen:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error procesando imagen',
        text: 'Hubo un problema al procesar la imagen. Inténtalo nuevamente.',
        confirmButtonText: 'Entendido'
      });
    }
  }

  // --- MÉTODOS DE IA ---

  /**
   * Genera un nombre de producto usando IA (simulado).
   */
  async generarNombreIA(): Promise<void> {
    const categoria = this.formularioProducto.get('categoria')?.value;
    
    if (!categoria) {
      Swal.fire({
        icon: 'info',
        title: 'Selecciona una categoría',
        text: 'Primero selecciona una categoría para generar un nombre apropiado',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Simulación de generación con IA
    const nombresIA = {
      'Electrónicos': [
        'Smartphone Ultra Pro Max 256GB',
        'Laptop Gaming RGB Elite',
        'Auriculares Bluetooth Premium',
        'Tablet 10" Full HD',
        'Smartwatch Deportivo GPS'
      ],
      'Ropa': [
        'Remera Premium Cotton Soft',
        'Jean Slim Fit Clásico',
        'Campera Impermeable Sport',
        'Zapatillas Running Pro',
        'Vestido Elegante Casual'
      ],
      'Hogar': [
        'Cafetera Automática Express',
        'Aspiradora Robot Inteligente',
        'Set Ollas Antiadherentes',
        'Lámpara LED Regulable',
        'Organizador Multiuso'
      ],
      'Deportes': [
        'Pelota Fútbol Profesional',
        'Mancuernas Ajustables Set',
        'Bicicleta Mountain Bike',
        'Colchoneta Yoga Premium',
        'Cuerda Saltar Profesional'
      ],
      'Libros': [
        'Manual Programación Avanzada',
        'Novela Bestseller Internacional',
        'Guía Completa Marketing Digital',
        'Enciclopedia Visual Moderna',
        'Libro Cocina Gourmet'
      ],
      'Juguetes': [
        'Set Bloques Construcción',
        'Muñeca Interactiva Parlante',
        'Auto Control Remoto 4WD',
        'Puzzle 1000 Piezas Paisaje',
        'Juego Mesa Estrategia'
      ],
      'Belleza': [
        'Crema Facial Anti-edad',
        'Set Maquillaje Profesional',
        'Perfume Floral Premium',
        'Mascarilla Hidratante Natural',
        'Kit Cuidado Capilar'
      ],
      'Automotriz': [
        'Aceite Motor Sintético 5W-30',
        'Neumático Radial 195/65R15',
        'Batería Auto 12V 60Ah',
        'Kit Herramientas Mecánico',
        'Cargador USB Dual Auto'
      ]
    };

    const opciones = nombresIA[categoria as keyof typeof nombresIA] || ['Producto Genérico'];
    const nombreGenerado = opciones[Math.floor(Math.random() * opciones.length)];

    // Mostrar loading
    Swal.fire({
      title: 'Generando nombre con IA...',
      html: 'Analizando categoría y tendencias del mercado',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular delay de IA
    setTimeout(() => {
      this.formularioProducto.patchValue({ nombre: nombreGenerado });
      
      Swal.fire({
        icon: 'success',
        title: '¡Nombre generado!',
        text: `Se generó: "${nombreGenerado}"`,
        timer: 2000,
        showConfirmButton: false
      });
    }, 1500);
  }

  /**
   * Genera una descripción de producto usando IA (simulado).
   */
  async generarDescripcionIA(): Promise<void> {
    const nombre = this.formularioProducto.get('nombre')?.value;
    const categoria = this.formularioProducto.get('categoria')?.value;

    if (!nombre || !categoria) {
      Swal.fire({
        icon: 'info',
        title: 'Completa los datos básicos',
        text: 'Primero ingresa el nombre y categoría del producto',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Generando descripción con IA...',
      html: 'Analizando características y beneficios del producto',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular delay de IA
    setTimeout(() => {
      const descripcionGenerada = this.generarDescripcionPorCategoria(nombre, categoria);
      this.formularioProducto.patchValue({ descripcion: descripcionGenerada });
      
      Swal.fire({
        icon: 'success',
        title: '¡Descripción generada!',
        text: 'Se creó una descripción optimizada para tu producto',
        timer: 2000,
        showConfirmButton: false
      });
    }, 2000);
  }

  /**
   * Genera una URL de imagen usando IA (simulado).
   */
  async generarImagenIA(): Promise<void> {
    const nombre = this.formularioProducto.get('nombre')?.value;
    const categoria = this.formularioProducto.get('categoria')?.value;

    if (!nombre) {
      Swal.fire({
        icon: 'info',
        title: 'Ingresa el nombre del producto',
        text: 'Primero ingresa el nombre para generar una imagen apropiada',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar loading
    Swal.fire({
      title: 'Generando imagen con IA...',
      html: 'Creando imagen optimizada para e-commerce',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Simular delay de IA
    setTimeout(() => {
      // Generar URL de placeholder personalizada
      const nombreEncoded = encodeURIComponent(nombre.slice(0, 20));
      const colorCategoria = this.obtenerColorCategoria(categoria);
      const imagenGenerada = `https://via.placeholder.com/400x300/${colorCategoria}/ffffff?text=${nombreEncoded}`;
      
      this.formularioProducto.patchValue({ imagen: imagenGenerada });
      
      Swal.fire({
        icon: 'success',
        title: '¡Imagen generada!',
        text: 'Se creó una imagen placeholder personalizada',
        timer: 2000,
        showConfirmButton: false
      });
    }, 1800);
  }

  // --- MÉTODOS AUXILIARES DE IA ---

  /**
   * Genera una descripción personalizada según la categoría.
   */
  private generarDescripcionPorCategoria(nombre: string, categoria: string): string {
    const plantillas = {
      'Electrónicos': `${nombre} es un dispositivo electrónico de última generación que combina tecnología avanzada con diseño elegante. Cuenta con características premium que garantizan un rendimiento excepcional y durabilidad superior. Ideal para usuarios que buscan calidad y innovación en un solo producto.`,
      
      'Ropa': `${nombre} está confeccionado con materiales de alta calidad que ofrecen comodidad y estilo. Su diseño moderno y versátil lo convierte en la elección perfecta para cualquier ocasión. Disponible en diferentes tallas para adaptarse a todos los gustos y preferencias.`,
      
      'Hogar': `${nombre} es el complemento perfecto para tu hogar, combinando funcionalidad y estética. Fabricado con materiales resistentes y duraderos, este producto mejorará tu calidad de vida diaria. Fácil de usar y mantener, ideal para familias modernas.`,
      
      'Deportes': `${nombre} está diseñado para deportistas y entusiastas del fitness que buscan equipamiento de calidad profesional. Su construcción robusta y características técnicas avanzadas te ayudarán a alcanzar tus objetivos deportivos con seguridad y eficiencia.`,
      
      'Libros': `${nombre} es una obra imprescindible que ofrece conocimientos valiosos y entretenimiento de calidad. Con contenido cuidadosamente seleccionado y presentado de manera clara y atractiva, este libro se convertirá en un recurso valioso para tu biblioteca personal.`,
      
      'Juguetes': `${nombre} es un juguete educativo y divertido que estimula la creatividad y el desarrollo cognitivo. Fabricado con materiales seguros y no tóxicos, ofrece horas de entretenimiento saludable para niños de todas las edades.`,
      
      'Belleza': `${nombre} es un producto de belleza premium formulado con ingredientes de alta calidad. Su fórmula avanzada proporciona resultados visibles y duraderos, cuidando tu piel con la delicadeza que mereces. Dermatológicamente testado.`,
      
      'Automotriz': `${nombre} es un componente automotriz de calidad superior diseñado para mejorar el rendimiento y la seguridad de tu vehículo. Fabricado bajo estrictos estándares de calidad, garantiza durabilidad y confiabilidad en todas las condiciones de manejo.`
    };

    return plantillas[categoria as keyof typeof plantillas] || 
           `${nombre} es un producto de excelente calidad que combina funcionalidad, durabilidad y diseño atractivo. Ideal para usuarios que buscan productos confiables y de alto rendimiento.`;
  }

  /**
   * Obtiene un color representativo para cada categoría.
   */
  private obtenerColorCategoria(categoria: string): string {
    const colores = {
      'Electrónicos': '0077b6',
      'Ropa': 'e63946',
      'Hogar': '2d6a4f',
      'Deportes': 'f77f00',
      'Libros': '6f1d1b',
      'Juguetes': 'e9c46a',
      'Belleza': 'd63384',
      'Automotriz': '495057'
    };

    return colores[categoria as keyof typeof colores] || '6c757d';
  }

  /**
   * Simula el análisis de IA basado en el nombre del archivo y tipo.
   */
  private simularAnalisisIA(nombreArchivo: string, tipoArchivo: string): any {
    const nombreLower = nombreArchivo.toLowerCase();
    
    // Base de datos de reconocimiento simulado
    const patrones = {
      // Electrónicos
      'phone|smartphone|celular|móvil|iphone|samsung|galaxy': {
        categoria: 'Electrónicos',
        nombres: ['Smartphone Premium 128GB', 'Teléfono Inteligente Pro', 'Celular Ultra HD'],
        precios: [89999, 125000, 67000]
      },
      'laptop|notebook|computer|pc|macbook': {
        categoria: 'Electrónicos',
        nombres: ['Laptop Gaming Pro', 'Notebook Ultrabook', 'Computadora Portátil'],
        precios: [150000, 89000, 120000]
      },
      'headphone|auricular|audio|speaker': {
        categoria: 'Electrónicos',
        nombres: ['Auriculares Bluetooth Premium', 'Headphones Inalámbricos', 'Parlante Bluetooth'],
        precios: [25000, 45000, 35000]
      },
      
      // Ropa
      'shirt|remera|camiseta|playera': {
        categoria: 'Ropa',
        nombres: ['Remera Premium Cotton', 'Camiseta Deportiva', 'Playera Casual'],
        precios: [8500, 12000, 6500]
      },
      'jean|pantalon|pants|trouser': {
        categoria: 'Ropa',
        nombres: ['Jean Slim Fit', 'Pantalón Casual', 'Jeans Clásico'],
        precios: [15000, 18000, 12500]
      },
      'shoe|zapato|zapatilla|sneaker': {
        categoria: 'Ropa',
        nombres: ['Zapatillas Running', 'Sneakers Urbanos', 'Zapatos Deportivos'],
        precios: [22000, 28000, 35000]
      },
      
      // Hogar
      'coffee|cafetera|café': {
        categoria: 'Hogar',
        nombres: ['Cafetera Automática Express', 'Máquina de Café Premium', 'Cafetera Italiana'],
        precios: [45000, 67000, 25000]
      },
      'lamp|lámpara|luz|light': {
        categoria: 'Hogar',
        nombres: ['Lámpara LED Regulable', 'Luz Decorativa', 'Iluminación Moderna'],
        precios: [12000, 8500, 15000]
      },
      
      // Deportes
      'ball|pelota|fútbol|soccer': {
        categoria: 'Deportes',
        nombres: ['Pelota Fútbol Profesional', 'Balón Oficial', 'Pelota Deportiva'],
        precios: [8500, 12000, 6500]
      },
      'bike|bicicleta|bicycle': {
        categoria: 'Deportes',
        nombres: ['Bicicleta Mountain Bike', 'Bike Urbana', 'Bicicleta Deportiva'],
        precios: [85000, 120000, 65000]
      }
    };
    
    // Buscar coincidencias
    for (const [patron, datos] of Object.entries(patrones)) {
      const regex = new RegExp(patron, 'i');
      if (regex.test(nombreLower)) {
        const indiceAleatorio = Math.floor(Math.random() * datos.nombres.length);
        return {
          categoria: datos.categoria,
          nombre: datos.nombres[indiceAleatorio],
          precio: datos.precios[indiceAleatorio],
          descripcion: this.generarDescripcionPorCategoria(datos.nombres[indiceAleatorio], datos.categoria)
        };
      }
    }
    
    // Producto genérico si no se encuentra patrón
    return {
      categoria: 'Electrónicos',
      nombre: 'Producto Detectado por IA',
      precio: 25000,
      descripcion: 'Producto de calidad detectado automáticamente por inteligencia artificial. Revisa y ajusta los detalles según corresponda.'
    };
  }

  /**
   * Aplica los resultados del análisis de Gemini al formulario.
   */
  private aplicarResultadosGemini(resultado: ResultadoAnalisisGemini): void {
    this.formularioProducto.patchValue({
      nombre: resultado.nombre,
      categoria: resultado.categoria,
      precio: resultado.precio,
      descripcion: resultado.descripcion,
      stock: 10, // Stock por defecto
      activo: true,
      esDestacado: resultado.confianza > 0.8 // Destacar si la confianza es alta
    });
  }

  /**
   * Muestra los resultados completos del análisis de Gemini 2.0 Flash.
   */
  private mostrarResultadosAnalisis(resultado: ResultadoAnalisisGemini): void {
    const confianzaPorcentaje = Math.round(resultado.confianza * 100);
    const iconoConfianza = resultado.confianza > 0.8 ? 'bi-check-circle text-success' : 
                          resultado.confianza > 0.6 ? 'bi-exclamation-circle text-warning' : 
                          'bi-question-circle text-info';
    
    const caracteristicasHtml = resultado.caracteristicas.length > 0 ? 
      `<li class="mb-2"><i class="bi bi-list-check text-success me-2"></i><strong>Características:</strong> ${resultado.caracteristicas.join(', ')}</li>` : '';

    const especificacionesHtml = resultado.especificaciones ? `
      <div class="row mt-3">
        <div class="col-md-6">
          <h6 class="text-secondary mb-2"><i class="bi bi-gear me-1"></i>Especificaciones Detectadas:</h6>
          <ul class="list-unstyled small">
            ${resultado.especificaciones.color ? `<li><strong>Color:</strong> ${resultado.especificaciones.color}</li>` : ''}
            ${resultado.especificaciones.material ? `<li><strong>Material:</strong> ${resultado.especificaciones.material}</li>` : ''}
            ${resultado.especificaciones.tamaño ? `<li><strong>Tamaño:</strong> ${resultado.especificaciones.tamaño}</li>` : ''}
            ${resultado.especificaciones.estado ? `<li><strong>Estado:</strong> ${resultado.especificaciones.estado}</li>` : ''}
            ${resultado.especificaciones.marca ? `<li><strong>Marca:</strong> ${resultado.especificaciones.marca}</li>` : ''}
          </ul>
        </div>
        <div class="col-md-6">
          ${resultado.palabras_clave && resultado.palabras_clave.length > 0 ? `
            <h6 class="text-secondary mb-2"><i class="bi bi-tags me-1"></i>Palabras Clave SEO:</h6>
            <div class="d-flex flex-wrap gap-1">
              ${resultado.palabras_clave.map(palabra => `<span class="badge bg-primary">${palabra}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    ` : '';

    const observacionesHtml = resultado.observaciones ? `
      <div class="alert alert-secondary mt-3">
        <i class="bi bi-info-circle me-2"></i>
        <strong>Observaciones del análisis:</strong><br>
        <small>${resultado.observaciones}</small>
      </div>
    ` : '';

    Swal.fire({
      icon: 'success',
      title: '🚀 ¡Producto listo para publicar!',
      html: `
        <div class="text-start">
          <div class="d-flex align-items-center mb-3">
            <i class="bi bi-stars fs-4 text-warning me-2"></i>
            <h6 class="text-primary mb-0">Análisis completo con Gemini 2.0 Flash:</h6>
          </div>
          
          <div class="card border-0 bg-light mb-3">
            <div class="card-body py-2">
              <h6 class="card-title text-success mb-2">
                <i class="bi bi-box-seam me-1"></i>${resultado.nombre}
              </h6>
              <p class="card-text small mb-1">${resultado.descripcion}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-info">${resultado.categoria}</span>
                <strong class="text-success">$${resultado.precio.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <ul class="list-unstyled">
            ${caracteristicasHtml}
            <li class="mb-2"><i class="${iconoConfianza} me-2"></i><strong>Precisión del análisis:</strong> ${confianzaPorcentaje}%</li>
          </ul>

          ${especificacionesHtml}
          
          <div class="alert alert-success mt-3">
            <i class="bi bi-check-circle me-2"></i>
            <strong>¡Producto analizado y listo!</strong><br>
            <small>Gemini 2.0 Flash ha generado todo el contenido necesario para publicar. Puedes editar cualquier campo antes de guardar.</small>
          </div>
          
          ${resultado.confianza < 0.7 ? 
            '<div class="alert alert-warning mt-2"><i class="bi bi-exclamation-triangle me-2"></i><small>Confianza media. Te recomendamos revisar los datos generados.</small></div>' : 
            '<div class="alert alert-info mt-2"><i class="bi bi-trophy me-2"></i><small>¡Excelente! Alta confianza en el análisis. El producto está listo para publicar.</small></div>'}
          
          ${observacionesHtml}
        </div>
      `,
      confirmButtonText: '✅ Perfecto, guardar producto',
      showCancelButton: true,
      cancelButtonText: '✏️ Editar antes de guardar',
      width: 800,
      customClass: {
        popup: 'swal-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Auto-guardar el producto si el usuario confirma
        this.guardarProducto();
      }
      // Si cancela, el usuario puede seguir editando el formulario
    });
  }

  /**
   * Muestra un error cuando el análisis de Gemini falla.
   */
  private mostrarErrorAnalisis(resultado: ResultadoAnalisisGemini): void {
    Swal.fire({
      icon: 'warning',
      title: '⚠️ Análisis en Modo Simulación',
      html: `
        <div class="text-start">
          <p class="mb-3">El análisis de imagen no pudo completarse con Gemini AI.</p>
          
          <div class="alert alert-warning">
            <h6><i class="bi bi-exclamation-triangle me-2"></i>Posibles causas:</h6>
            <ul class="mb-0">
              <li>API Key de Gemini inválida o expirada</li>
              <li>Límite de cuota excedido</li>
              <li>Problema de conectividad</li>
              <li>Imagen no compatible</li>
            </ul>
          </div>

          <div class="alert alert-info">
            <h6><i class="bi bi-lightbulb me-2"></i>Soluciones:</h6>
            <ul class="mb-0">
              <li>Haz clic en "Probar conexión" para verificar Gemini</li>
              <li>Revisa la consola (F12) para errores detallados</li>
              <li>Verifica tu API Key en Google AI Studio</li>
              <li>Intenta con una imagen diferente</li>
            </ul>
          </div>

          <p><strong>Resultado actual:</strong> ${resultado.observaciones}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '🔧 Probar conexión',
      cancelButtonText: '✏️ Editar manualmente',
      width: 600
    }).then((result) => {
      if (result.isConfirmed) {
        this.probarConexionGemini();
      }
    });
  }

  /**
   * Prueba la conexión con Gemini AI.
   */
  async probarConexionGemini(): Promise<void> {
    this.probandoConexion.set(true);
    
    try {
      const conexionExitosa = await this.geminiService.probarConexion();
      
      if (conexionExitosa) {
        Swal.fire({
          icon: 'success',
          title: '✅ ¡Conexión exitosa!',
          text: 'Gemini AI está funcionando correctamente. El análisis de imágenes será real.',
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '❌ Error de conexión',
          text: 'No se pudo conectar con Gemini AI. Revisa la consola para más detalles.',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error probando conexión:', error);
      Swal.fire({
        icon: 'error',
        title: '❌ Error de conexión',
        text: 'Ocurrió un error al probar la conexión con Gemini AI.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.probandoConexion.set(false);
    }
  }

  /**
   * Lista los modelos disponibles de Gemini AI.
   */
  async listarModelosGemini(): Promise<void> {
    this.probandoConexion.set(true);
    
    try {
      const modelos = await this.geminiService.listarModelosDisponibles();
      
      if (modelos.length > 0) {
        const modelosHtml = modelos.map(modelo => `<li class="text-start">${modelo}</li>`).join('');
        
        Swal.fire({
          icon: 'info',
          title: '📋 Modelos Gemini Disponibles',
          html: `
            <div class="text-start">
              <p class="mb-3">Modelos disponibles en tu región:</p>
              <ul class="list-unstyled">
                ${modelosHtml}
              </ul>
              <div class="alert alert-info mt-3">
                <small><i class="bi bi-info-circle me-1"></i>
                El sistema probará estos modelos automáticamente hasta encontrar uno que funcione.</small>
              </div>
            </div>
          `,
          confirmButtonText: 'Entendido',
          width: 500
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: '⚠️ No se pudieron obtener modelos',
          text: 'No se pudo acceder a la lista de modelos. Verifica tu API Key y conexión.',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error listando modelos:', error);
      Swal.fire({
        icon: 'error',
        title: '❌ Error',
        text: 'Ocurrió un error al obtener la lista de modelos.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.probandoConexion.set(false);
    }
  }

  /**
   * Prueba modelos simples para diagnóstico.
   */
  async probarModelosSimples(): Promise<void> {
    this.probandoConexion.set(true);
    
    try {
      const modelosParaProbar = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-2.0-flash-exp',
        'gemini-2.5-flash-exp'
      ];
      
      console.log('🔧 Iniciando diagnóstico de modelos...');
      const resultados: { modelo: string; funciona: boolean }[] = [];
      
      for (const modelo of modelosParaProbar) {
        console.log(`🧪 Probando ${modelo}...`);
        const funciona = await this.geminiService.probarModeloSimple(modelo);
        resultados.push({ modelo, funciona });
      }
      
      const modelosFuncionan = resultados.filter(r => r.funciona);
      const modelosNoFuncionan = resultados.filter(r => !r.funciona);
      
      const funcionanHtml = modelosFuncionan.length > 0 ? 
        `<div class="alert alert-success">
          <h6><i class="bi bi-check-circle me-2"></i>Modelos que funcionan:</h6>
          <ul class="mb-0">
            ${modelosFuncionan.map(r => `<li>${r.modelo}</li>`).join('')}
          </ul>
        </div>` : '';
      
      const noFuncionanHtml = modelosNoFuncionan.length > 0 ? 
        `<div class="alert alert-warning">
          <h6><i class="bi bi-x-circle me-2"></i>Modelos que no funcionan:</h6>
          <ul class="mb-0">
            ${modelosNoFuncionan.map(r => `<li>${r.modelo}</li>`).join('')}
          </ul>
        </div>` : '';
      
      Swal.fire({
        icon: modelosFuncionan.length > 0 ? 'success' : 'warning',
        title: '🔧 Diagnóstico de Modelos Gemini',
        html: `
          <div class="text-start">
            <p class="mb-3">Resultados del diagnóstico:</p>
            ${funcionanHtml}
            ${noFuncionanHtml}
            <div class="alert alert-info mt-3">
              <small><i class="bi bi-info-circle me-1"></i>
              ${modelosFuncionan.length > 0 ? 
                'El sistema usará automáticamente uno de los modelos que funcionan.' : 
                'Ningún modelo funciona. Verifica tu API Key y conexión.'}</small>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        width: 600
      });
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      Swal.fire({
        icon: 'error',
        title: '❌ Error en Diagnóstico',
        text: 'Ocurrió un error durante el diagnóstico de modelos.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.probandoConexion.set(false);
    }
  }
}
