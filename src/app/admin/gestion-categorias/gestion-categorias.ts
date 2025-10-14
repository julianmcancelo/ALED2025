import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService, Categoria } from '../../servicios/categoria.service';
import Swal from 'sweetalert2';

/**
 * ============================================================================
 * COMPONENTE DE GESTIÓN DE CATEGORÍAS - PANEL DE ADMINISTRACIÓN
 * ============================================================================
 * 
 * Este componente permite a los administradores gestionar las categorías
 * de productos del sistema de e-commerce ALED2025.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Crear nuevas categorías
 * - Editar categorías existentes
 * - Eliminar categorías
 * - Visualizar lista completa de categorías
 * - Búsqueda y filtrado de categorías
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Header del componente -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h2 class="mb-1">
                <i class="bi bi-tags me-2"></i>
                Gestión de Categorías
              </h2>
              <p class="text-muted mb-0">
                Administra las categorías de productos de tu tienda
              </p>
            </div>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-outline-primary"
                (click)="cargarCategorias()"
                [disabled]="cargando()">
                <i class="bi bi-arrow-clockwise me-1"></i>
                {{ cargando() ? 'Cargando...' : 'Actualizar' }}
              </button>
              <button 
                class="btn btn-success"
                (click)="mostrarModalCrear()">
                <i class="bi bi-plus-circle me-1"></i>
                Nueva Categoría
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Total Categorías</h6>
                  <h3 class="mb-0">{{ categorias().length }}</h3>
                </div>
                <i class="bi bi-tags fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-success text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Activas</h6>
                  <h3 class="mb-0">{{ categorias().length }}</h3>
                </div>
                <i class="bi bi-check-circle fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-info text-white">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="card-title">Última Actualización</h6>
                  <h6 class="mb-0">{{ obtenerFechaActual() }}</h6>
                </div>
                <i class="bi bi-clock fs-1 opacity-50"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-6">
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-search"></i>
                    </span>
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="Buscar categorías..."
                      [(ngModel)]="filtroNombre"
                      (input)="aplicarFiltros()">
                  </div>
                </div>
                <div class="col-md-6 text-end">
                  <small class="text-muted">
                    Mostrando {{ categoriasFiltradas().length }} de {{ categorias().length }} categorías
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de categorías -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">
                <i class="bi bi-list me-2"></i>
                Lista de Categorías
              </h5>
            </div>
            <div class="card-body">
              
              <!-- Estado de carga -->
              <div *ngIf="cargando()" class="text-center py-4">
                <div class="spin ner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando categorías...</p>
              </div>

              <!-- Sin categorías -->
              <div *ngIf="!cargando() && categoriasFiltradas().length === 0" class="text-center py-4">
                <i class="bi bi-tags display-1 text-muted"></i>
                <h4 class="mt-3">No hay categorías</h4>
                <p class="text-muted">
                  {{ categorias().length === 0 ? 'No se encontraron categorías.' : 'No se encontraron categorías con los filtros aplicados.' }}
                </p>
                <button 
                  *ngIf="categorias().length === 0"
                  class="btn btn-primary"
                  (click)="mostrarModalCrear()">
                  <i class="bi bi-plus-circle me-1"></i>
                  Crear Primera Categoría
                </button>
              </div>

              <!-- Tabla de categorías -->
              <div *ngIf="!cargando() && categoriasFiltradas().length > 0" class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let categoria of categoriasFiltradas(); trackBy: trackByCategoria">
                      <td>
                        <code class="text-muted">{{ categoria.id }}</code>
                      </td>
                      <td>
                        <div class="d-flex align-items-center">
                          <i class="bi bi-tag me-2 text-primary"></i>
                          <strong>{{ categoria.nombre }}</strong>
                        </div>
                      </td>
                      <td>
                        <div class="btn-group" role="group">
                          <button 
                            class="btn btn-outline-primary btn-sm"
                            (click)="mostrarModalEditar(categoria)"
                            title="Editar categoría">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button 
                            class="btn btn-outline-danger btn-sm"
                            (click)="confirmarEliminar(categoria)"
                            title="Eliminar categoría">
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
    .card {
      border: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .card:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .btn {
      transition: all 0.3s ease;
      border-radius: 8px;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .table th {
      border-top: none;
      font-weight: 600;
      color: #495057;
      background-color: #f8f9fa;
    }

    .table td {
      vertical-align: middle;
    }

    .display-1 {
      font-size: 6rem;
      font-weight: 300;
      line-height: 1.2;
    }

    .input-group-text {
      background-color: #f8f9fa;
      border-color: #dee2e6;
    }

    .btn-group .btn {
      border-radius: 0;
    }

    .btn-group .btn:first-child {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }

    .btn-group .btn:last-child {
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }
  `]
})
export class GestionCategoriasComponent implements OnInit {

  // --- SIGNALS PARA ESTADO REACTIVO ---
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  
  // --- FILTROS ---
  filtroNombre = '';

  // --- COMPUTED SIGNALS ---
  categoriasFiltradas = computed(() => {
    const categorias = this.categorias();
    const filtro = this.filtroNombre.toLowerCase().trim();
    
    if (!filtro) {
      return categorias;
    }
    
    return categorias.filter(categoria => 
      categoria.nombre.toLowerCase().includes(filtro)
    );
  });

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  // --- MÉTODOS PRINCIPALES ---

  /**
   * Carga todas las categorías desde Firebase
   */
  cargarCategorias(): void {
    this.cargando.set(true);
    
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorías cargadas:', categorias);
        this.categorias.set(categorias);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        this.cargando.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las categorías'
        });
      }
    });
  }

  /**
   * Muestra el modal para crear una nueva categoría
   */
  async mostrarModalCrear(): Promise<void> {
    const { value: nombre } = await Swal.fire({
      title: 'Nueva Categoría',
      input: 'text',
      inputLabel: 'Nombre de la categoría',
      inputPlaceholder: 'Ej: Electrónicos, Ropa, Hogar...',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'El nombre de la categoría es obligatorio';
        }
        if (value.trim().length < 2) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        if (this.categorias().some(c => c.nombre.toLowerCase() === value.trim().toLowerCase())) {
          return 'Ya existe una categoría con ese nombre';
        }
        return null;
      }
    });

    if (nombre) {
      await this.crearCategoria(nombre.trim());
    }
  }

  /**
   * Muestra el modal para editar una categoría existente
   */
  async mostrarModalEditar(categoria: Categoria): Promise<void> {
    const { value: nombre } = await Swal.fire({
      title: 'Editar Categoría',
      input: 'text',
      inputValue: categoria.nombre,
      inputLabel: 'Nombre de la categoría',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'El nombre de la categoría es obligatorio';
        }
        if (value.trim().length < 2) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        if (value.trim() !== categoria.nombre && 
            this.categorias().some(c => c.nombre.toLowerCase() === value.trim().toLowerCase())) {
          return 'Ya existe una categoría con ese nombre';
        }
        return null;
      }
    });

    if (nombre && nombre.trim() !== categoria.nombre) {
      await this.editarCategoria(categoria.id!, nombre.trim());
    }
  }

  /**
   * Confirma la eliminación de una categoría
   */
  async confirmarEliminar(categoria: Categoria): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la categoría "${categoria.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await this.eliminarCategoria(categoria.id!);
    }
  }

  // --- MÉTODOS CRUD ---

  /**
   * Crea una nueva categoría
   */
  private async crearCategoria(nombre: string): Promise<void> {
    try {
      await this.categoriaService.crearCategoria(nombre);
      
      Swal.fire({
        icon: 'success',
        title: '¡Categoría creada!',
        text: `La categoría "${nombre}" se creó exitosamente`,
        timer: 2000,
        showConfirmButton: false
      });
      
      // Las categorías se actualizarán automáticamente por el Observable
    } catch (error) {
      console.error('❌ Error al crear categoría:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la categoría'
      });
    }
  }

  /**
   * Edita una categoría existente
   */
  private async editarCategoria(id: string, nombre: string): Promise<void> {
    try {
      await this.categoriaService.actualizarCategoria(id, nombre);
      
      Swal.fire({
        icon: 'success',
        title: '¡Categoría actualizada!',
        text: `La categoría se actualizó a "${nombre}"`,
        timer: 2000,
        showConfirmButton: false
      });
      
      // Las categorías se actualizarán automáticamente por el Observable
    } catch (error) {
      console.error('❌ Error al actualizar categoría:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la categoría'
      });
    }
  }

  /**
   * Elimina una categoría
   */
  private async eliminarCategoria(id: string): Promise<void> {
    try {
      await this.categoriaService.eliminarCategoria(id);
      
      Swal.fire({
        icon: 'success',
        title: '¡Categoría eliminada!',
        text: 'La categoría se eliminó exitosamente',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Las categorías se actualizarán automáticamente por el Observable
    } catch (error) {
      console.error('❌ Error al eliminar categoría:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar la categoría'
      });
    }
  }

  // --- MÉTODOS DE UTILIDAD ---

  /**
   * Aplica los filtros de búsqueda
   */
  aplicarFiltros(): void {
    // Los computed signals se actualizan automáticamente
  }

  /**
   * TrackBy function para optimizar el renderizado de la lista
   */
  trackByCategoria(index: number, categoria: Categoria): string {
    return categoria.id || index.toString();
  }

  /**
   * Obtiene la fecha actual formateada
   */
  obtenerFechaActual(): string {
    return new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
