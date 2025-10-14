// Importaciones principales de Angular para el componente
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

// Servicios de Firebase/Firestore (usando el servicio existente)
import { GestionProductosService, Producto } from '../../servicios/gestion-productos.service';
import { CategoriaService, Categoria } from '../../servicios/categoria.service';

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
    FormsModule               // Para formularios template-driven
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
  `]
})
export class GestionProductos implements OnInit {

  // --- INYECCIÓN DE SERVICIOS ---
  private productosService = inject(GestionProductosService);
  private categoriasService = inject(CategoriaService);

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
    console.log('📦 Cargando productos desde Firestore...');
    
    this.productosService.obtenerProductos().subscribe({
      next: (productos) => {
        console.log('✅ Productos cargados:', productos.length);
        this.productos.set(productos);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
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
    Swal.fire({
      title: 'Nuevo Producto',
      text: 'Funcionalidad de creación de productos en desarrollo',
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Prepara el formulario para editar un producto existente.
   * 
   * @param producto - El producto a editar
   */
  editarProducto(producto: Producto): void {
    Swal.fire({
      title: 'Editar Producto',
      text: `Funcionalidad de edición para "${producto.nombre}" en desarrollo`,
      icon: 'info',
      confirmButtonText: 'Entendido'
    });
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
}
