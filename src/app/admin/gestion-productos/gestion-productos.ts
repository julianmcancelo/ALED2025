// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Importar pipes y directivas personalizadas
import { PrecioPipe } from '../../shared/pipes/precio.pipe';
import { FechaRelativaPipe } from '../../shared/pipes/fecha-relativa.pipe';
import { HighlightDirective } from '../../shared/directives/highlight.directive';
// import { LoadingButtonDirective } from '../../shared/directives/loading-button.directive'; // REMOVIDO
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas
import { CategoriaService, Categoria } from '../../servicios/categoria.service';
import { GestionProductosService, Producto } from '../../servicios/gestion-productos.service';

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
    HttpClientModule,         // Para peticiones HTTP a Gemini AI
    // Pipes y directivas personalizadas
    PrecioPipe,
    FechaRelativaPipe,
    HighlightDirective
    // LoadingButtonDirective // REMOVIDO
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
                (click)="mostrarFormularioNuevo()"
                [disabled]="guardandoProducto()">
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
                  <!-- Indicador removido -->
                </div>
                <button 
                  type="button" 
                  class="btn btn-outline-light btn-sm"
                  (click)="cancelarFormulario()">
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
                          title="Generar nombre con IA (Futura implementación)">
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
                          Análisis con IA - Funcionalidad para futura implementación
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
>
                        
                        <!-- Estado del análisis removido -->
                        
                        <small class="form-text text-success" *ngIf="imagenSeleccionada()">
                          <i class="bi bi-check-circle me-1"></i>
                          ¡Imagen cargada correctamente!
                        </small>
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
                          title="Generar descripción con IA (Futura implementación)">
                          <i class="bi bi-magic me-1"></i>
                          IA*
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
                          class="btn btn-success btn-lg"
                          style="min-width: 150px;"
                          [disabled]="formularioProducto.invalid || guardandoProducto()">
                          <span *ngIf="!guardandoProducto()">
                            <i class="bi bi-check-circle me-1"></i>
                            {{ productoEditando() ? 'Actualizar' : 'Crear' }} Producto
                          </span>
                          <span *ngIf="guardandoProducto()">
                            <i class="bi bi-hourglass-split me-1"></i>
                            Guardando...
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Nota sobre funcionalidades de IA -->
                <div class="alert alert-info mt-3">
                  <i class="bi bi-info-circle me-2"></i>
                  <small><strong>Nota:</strong> Las funcionalidades marcadas con <strong>IA*</strong> están planificadas para futuras versiones del sistema.</small>
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
                          <br>
                          <small class="text-info">
                            <i class="bi bi-clock me-1"></i>
                            {{ (producto.fechaCreacion || obtenerFechaActual()) | fechaRelativa }}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-secondary">{{ producto.categoria }}</span>
                      </td>
                      <td>
                        <strong class="text-success" appHighlight [highlightColor]="'#e8f5e8'">
                          {{ producto.precio | precio }}
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
   * Signal que contiene la imagen seleccionada.
   */
  imagenSeleccionada = signal<File | null>(null);

  /**
   * Tipo de imagen seleccionado (archivo o URL).
   */
  tipoImagen: 'archivo' | 'url' = 'archivo';

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

  // --- MÉTODOS DE UTILIDAD ---

  /**
   * Obtiene la fecha actual para usar en templates
   */
  obtenerFechaActual(): Date {
    return new Date();
  }

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
   * MÉTODO ELIMINADO: procesarAnalisisConGemini
   * Funcionalidad de IA removida del sistema
   */
  private async procesarAnalisisConGemini(imagenBase64: string, tipoMime: string): Promise<void> {
    // Método simplificado - solo notificar que la imagen está lista
    Swal.fire({
      icon: 'success',
      title: '📸 ¡Imagen cargada!',
      text: 'La imagen se ha cargado correctamente. Completa el resto del formulario manualmente.',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }

  // --- MÉTODOS DE IA ELIMINADOS ---

  /**
   * MÉTODO ELIMINADO: generarNombreIA
   * Funcionalidad de IA removida del sistema
   */
  async generarNombreIA(): Promise<void> {
    Swal.fire({
      icon: 'info',
      title: 'Funcionalidad en desarrollo',
      text: 'La generación automática con IA estará disponible en futuras versiones. Por ahora, ingresa el nombre manualmente.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  /**
   * MÉTODO ELIMINADO: generarDescripcionIA
   * Funcionalidad de IA removida del sistema
   */
  async generarDescripcionIA(): Promise<void> {
    Swal.fire({
      icon: 'info',
      title: 'Funcionalidad en desarrollo',
      text: 'La generación automática de descripciones con IA estará disponible en futuras versiones. Por ahora, ingresa la descripción manualmente.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  /**
   * MÉTODO ELIMINADO: generarImagenIA
   * Funcionalidad de IA removida del sistema
   */
  async generarImagenIA(): Promise<void> {
    Swal.fire({
      icon: 'info',
      title: 'Funcionalidad en desarrollo',
      text: 'La generación automática de imágenes con IA estará disponible en futuras versiones. Por ahora, sube una imagen manualmente.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  // --- MÉTODOS AUXILIARES DE IA ELIMINADOS ---

  /**
   * MÉTODO ELIMINADO: generarDescripcionPorCategoria
   * Funcionalidad de IA removida del sistema
   */
  private generarDescripcionPorCategoria(nombre: string, categoria: string): string {
    return `${nombre} - Descripción manual requerida.`;
  }

  /**
   * MÉTODO ELIMINADO: obtenerColorCategoria
   * Funcionalidad de IA removida del sistema
   */
  private obtenerColorCategoria(categoria: string): string {
    return '6c757d'; // Color gris por defecto
  }

  /**
   * MÉTODO ELIMINADO: simularAnalisisIA
   * Funcionalidad de IA removida del sistema
   */
  private simularAnalisisIA(nombreArchivo: string, tipoArchivo: string): any {
    return null; // Sin análisis IA
  }

  // --- MÉTODOS DE GEMINI ELIMINADOS ---

  /**
   * MÉTODO ELIMINADO: aplicarResultadosGemini
   */
  private aplicarResultadosGemini(resultado: any): void {
    // Método obsoleto - removido
  }

  /**
   * MÉTODO ELIMINADO: mostrarResultadosAnalisis
   */
  private mostrarResultadosAnalisis(resultado: any): void {
    // Método obsoleto - removido
  }

  /**
   * MÉTODO ELIMINADO: mostrarErrorAnalisis
   */
  private mostrarErrorAnalisis(resultado: any): void {
    // Método obsoleto - removido
  }

  /**
   * MÉTODO ELIMINADO: probarConexionGemini
   */
  async probarConexionGemini(): Promise<void> {
    Swal.fire({
      icon: 'info',
      title: 'Funcionalidad en desarrollo',
      text: 'El análisis automático con IA estará disponible en futuras versiones del sistema.',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * MÉTODO ELIMINADO: listarModelosGemini
   */
  async listarModelosGemini(): Promise<void> {
    // Método obsoleto - removido
  }

  /**
   * MÉTODO ELIMINADO: probarModelosSimples
   */
  async probarModelosSimples(): Promise<void> {
    // Método obsoleto - removido
  }
}
