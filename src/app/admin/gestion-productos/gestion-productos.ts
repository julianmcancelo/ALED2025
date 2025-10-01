import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionProductosService, Producto } from '../../services/gestion-productos.service';
import { Categoria, CategoriaService } from '../../services/categoria.service'; // Importar servicio y modelo de categoría
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-productos.html',
  styleUrl: './gestion-productos.css',
})
export class GestionProductos implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private gestionProductosService = inject(GestionProductosService);
  private categoriaService = inject(CategoriaService); // Inyectar CategoriaService

  // --- PROPIEDADES DE PRODUCTOS ---
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;
  formularioProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: '',
    stock: 0,
    imagen: '',
    activo: true,
    esDestacado: false, // Nuevo campo
  };

  // --- PROPIEDADES DE CATEGORÍAS ---
  categorias: Categoria[] = [];
  mostrarGestionCategorias: boolean = false;
  categoriaEnEdicion: Categoria | null = null;
  nombreNuevaCategoria: string = '';

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias(); // Cargar categorías al iniciar
  }

  // --- MÉTODOS DE GESTIÓN DE PRODUCTOS (Existentes) ---
  cargarProductos(): void {
    this.gestionProductosService.obtenerProductos().subscribe({
      next: (productos) => (this.productos = productos),
      error: (error) => {
        console.error('Error al cargar productos:', error);
        Swal.fire('Error', 'No se pudieron cargar los productos.', 'error');
      },
    });
  }

  nuevoProducto(): void {
    this.modoEdicion = false;
    this.productoSeleccionado = null;
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  editarProducto(producto: Producto): void {
    this.modoEdicion = true;
    this.productoSeleccionado = producto;
    this.cargarDatosEnFormulario(producto);
    this.mostrarFormulario = true;
  }

  guardarProducto(): void {
    if (!this.validarFormulario()) return;
    if (this.modoEdicion) {
      this.actualizarProducto();
    } else {
      this.crearProducto();
    }
  }

  async eliminarProducto(producto: Producto): Promise<void> {
    if (!producto.id) return;
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás "${producto.nombre}". ¡No podrás revertir esto!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await this.gestionProductosService.eliminarProducto(producto.id);
        Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
      }
    }
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  // --- MÉTODOS DE GESTIÓN DE CATEGORÍAS (Nuevos) ---

  /**
   * Carga las categorías desde el servicio en tiempo real.
   */
  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias.sort((a, b) => a.nombre.localeCompare(b.nombre));
        console.log('Categorías cargadas:', this.categorias);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
        Swal.fire('Error', 'No se pudieron cargar las categorías.', 'error');
      },
    });
  }

  /**
   * Prepara el formulario para crear o editar una categoría.
   * @param categoria - La categoría a editar, o null para crear una nueva.
   */
  editarCategoria(categoria: Categoria | null): void {
    if (categoria) {
      this.categoriaEnEdicion = { ...categoria };
      this.nombreNuevaCategoria = categoria.nombre;
    } else {
      this.categoriaEnEdicion = null;
      this.nombreNuevaCategoria = '';
    }
  }

  /**
   * Guarda una categoría (la crea o la actualiza).
   */
  async guardarCategoria(): Promise<void> {
    const nombre = this.nombreNuevaCategoria.trim();
    if (!nombre) {
      Swal.fire('Inválido', 'El nombre de la categoría no puede estar vacío.', 'warning');
      return;
    }

    try {
      if (this.categoriaEnEdicion && this.categoriaEnEdicion.id) {
        // Actualizar categoría existente
        await this.categoriaService.actualizarCategoria(this.categoriaEnEdicion.id, nombre);
        Swal.fire('¡Actualizado!', 'La categoría ha sido actualizada.', 'success');
      } else {
        // Crear nueva categoría
        await this.categoriaService.crearCategoria(nombre);
        Swal.fire('¡Creada!', 'La nueva categoría ha sido creada.', 'success');
      }
      this.cancelarEdicionCategoria();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      Swal.fire('Error', 'No se pudo guardar la categoría.', 'error');
    }
  }

  /**
   * Elimina una categoría después de confirmación.
   * @param categoria - La categoría a eliminar.
   */
  async eliminarCategoria(categoria: Categoria): Promise<void> {
    if (!categoria.id) return;
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás la categoría "${categoria.nombre}". Esto no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await this.categoriaService.eliminarCategoria(categoria.id);
        Swal.fire('¡Eliminada!', 'La categoría ha sido eliminada.', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar la categoría.', 'error');
      }
    }
  }

  /**
   * Cierra el formulario de edición de categorías.
   */
  cancelarEdicionCategoria(): void {
    this.categoriaEnEdicion = null;
    this.nombreNuevaCategoria = '';
  }

  // --- MÉTODOS AUXILIARES ---
  private limpiarFormulario(): void {
    this.formularioProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: '',
      stock: 0,
      imagen: '',
      activo: true,
      esDestacado: false,
    };
  }

  private cargarDatosEnFormulario(producto: Producto): void {
    // Corregimos el problema de tipos asegurando valores por defecto
    this.formularioProducto = {
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || 0,
      categoria: producto.categoria || '',
      stock: producto.stock || 0,
      imagen: producto.imagen || '',
      activo: producto.activo !== undefined ? producto.activo : true,
      esDestacado: producto.esDestacado || false,
    };
  }

  private validarFormulario(): boolean {
    const { nombre, precio, categoria } = this.formularioProducto;
    if (!nombre.trim() || precio <= 0 || !categoria) {
      Swal.fire(
        'Formulario Incompleto',
        'Por favor, complete todos los campos obligatorios (*).',
        'warning',
      );
      return false;
    }
    return true;
  }

  /**
   * Crea un nuevo producto en la base de datos.
   */
  private crearProducto(): void {
    const nuevoProducto: Omit<Producto, 'id'> = { ...this.formularioProducto };
    this.gestionProductosService.crearProducto(nuevoProducto).subscribe({
      next: () => {
        Swal.fire('¡Creado!', 'El producto ha sido creado exitosamente.', 'success');
        this.cancelarFormulario();
      },
      error: (error) => {
        console.error('Error al crear producto:', error);
        Swal.fire('Error', 'Hubo un problema al crear el producto.', 'error');
      },
    });
  }

  /**
   * Actualiza un producto existente en la base de datos.
   */
  private actualizarProducto(): void {
    if (!this.productoSeleccionado?.id) return;

    const datosActualizados: Partial<Producto> = { ...this.formularioProducto };
    this.gestionProductosService
      .actualizarProducto(this.productoSeleccionado.id, datosActualizados)
      .subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'El producto ha sido actualizado.', 'success');
          this.cancelarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          Swal.fire('Error', 'No se pudo actualizar el producto.', 'error');
        },
      });
  }

  probarConexionFirestore(): void {
    // Lógica de prueba de conexión...
  }
}
