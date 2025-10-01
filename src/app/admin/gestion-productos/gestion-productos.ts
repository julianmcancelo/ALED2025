// Importaciones necesarias de Angular y servicios
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionProductosService, Producto } from '../../services/gestion-productos.service';
import Swal from 'sweetalert2';

/**
 * @component GestionProductos
 * Componente para la gestión completa de productos en el panel de administración.
 * 
 * Funcionalidades principales:
 * - Listar todos los productos existentes
 * - Crear nuevos productos con formulario validado
 * - Editar productos existentes
 * - Eliminar productos
 * - Gestionar el estado activo/inactivo de productos
 * - Controlar el stock de productos
 * 
 * @author Julian Manuel Cancelo
 * @version 1.0.0
 */
@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-productos.html',
  styleUrl: './gestion-productos.css',
})
export class GestionProductos implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  /**
   * Servicio para la gestión de productos
   * Se inyecta usando la función inject() de Angular
   */
  private gestionProductosService = inject(GestionProductosService);

  // --- PROPIEDADES DEL COMPONENTE ---
  
  /**
   * Array que contiene todos los productos cargados desde la base de datos
   */
  productos: Producto[] = [];
  
  /**
   * Producto actualmente seleccionado para edición
   * Es null cuando no hay ningún producto seleccionado
   */
  productoSeleccionado: Producto | null = null;
  
  /**
   * Controla si se muestra el formulario de creación/edición
   * true = formulario visible, false = lista de productos visible
   */
  mostrarFormulario: boolean = false;
  
  /**
   * Indica si el formulario está en modo edición o creación
   * true = editando producto existente, false = creando nuevo producto
   */
  modoEdicion: boolean = false;

  /**
   * Objeto que contiene los datos del formulario para crear/editar productos
   * Se inicializa con valores por defecto
   */
  formularioProducto = {
    nombre: '',        // Nombre del producto (requerido)
    descripcion: '',   // Descripción detallada del producto
    precio: 0,         // Precio del producto (requerido)
    categoria: '',     // Categoría del producto (requerido)
    stock: 0,          // Cantidad en stock
    imagen: '',        // URL de la imagen del producto
    activo: true       // Estado del producto (activo por defecto)
  };

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---

  /**
   * Método que se ejecuta al inicializar el componente
   * Se llama automáticamente después de que Angular inicializa las propiedades del componente
   */
  ngOnInit(): void {
    this.cargarProductos();
  }

  // --- MÉTODOS DE GESTIÓN DE DATOS ---

  /**
   * Carga la lista de productos desde el servicio
   * Se suscribe al observable para recibir actualizaciones en tiempo real
   */
  cargarProductos(): void {
    console.log('🔄 Iniciando carga de productos desde Firestore...');
    
    this.gestionProductosService.obtenerProductos().subscribe({
      next: (productos) => {
        console.log('✅ Productos recibidos desde Firestore:', productos);
        this.productos = productos;
        console.log(`📦 Total de productos cargados: ${productos.length}`);
        
        // Mostrar detalles de cada producto para debugging
        productos.forEach((producto, index) => {
          console.log(`Producto ${index + 1}:`, {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            categoria: producto.categoria,
            activo: producto.activo
          });
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar productos desde Firestore:', error);
        console.error('Detalles del error:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudieron cargar los productos desde la base de datos. Verifica la configuración de Firebase.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  // --- MÉTODOS DE GESTIÓN DEL FORMULARIO ---

  /**
   * Prepara el formulario para crear un nuevo producto
   * Limpia todos los campos y cambia a modo creación
   */
  nuevoProducto(): void {
    this.modoEdicion = false;                    // Modo creación
    this.productoSeleccionado = null;            // No hay producto seleccionado
    this.limpiarFormulario();                    // Limpia todos los campos
    this.mostrarFormulario = true;               // Muestra el formulario
    console.log('Preparando formulario para nuevo producto');
  }

  /**
   * Prepara el formulario para editar un producto existente
   * Carga los datos del producto seleccionado en el formulario
   * @param producto - El producto que se va a editar
   */
  editarProducto(producto: Producto): void {
    this.modoEdicion = true;                     // Modo edición
    this.productoSeleccionado = producto;        // Guarda referencia al producto
    this.cargarDatosEnFormulario(producto);      // Carga datos en el formulario
    this.mostrarFormulario = true;               // Muestra el formulario
    console.log('Editando producto:', producto.nombre);
  }

  /**
   * Guarda el producto según el modo actual (crear o actualizar)
   * Valida los datos antes de proceder con la operación
   */
  guardarProducto(): void {
    // Validación básica antes de guardar
    if (!this.validarFormulario()) {
      console.error('Formulario inválido, no se puede guardar');
      return;
    }

    if (this.modoEdicion) {
      this.actualizarProducto();               // Actualiza producto existente
    } else {
      this.crearProducto();                    // Crea nuevo producto
    }
  }

  /**
   * Elimina un producto después de confirmar con el usuario
   * @param producto Producto a eliminar
   */
  async eliminarProducto(producto: Producto): Promise<void> {
    // Verificar que el producto tenga ID
    if (!producto.id) {
      await Swal.fire({
        title: 'Error',
        text: 'No se puede eliminar el producto: ID no válido',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Mostrar confirmación con SweetAlert2
    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    // Si el usuario confirma, proceder con la eliminación
    if (resultado.isConfirmed) {
      try {
        await this.gestionProductosService.eliminarProducto(producto.id);
        
        // Recargar la lista de productos
        this.cargarProductos();
        
        // Mostrar mensaje de éxito
        await Swal.fire({
          title: '¡Eliminado!',
          text: `El producto "${producto.nombre}" ha sido eliminado correctamente.`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Hubo un problema al eliminar el producto. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  }

  /**
   * Método de prueba para verificar la conexión con Firestore
   * Muestra los resultados en la consola del navegador
   */
  async probarConexionFirestore(): Promise<void> {
    console.log('🔧 Iniciando prueba de conexión desde el componente...');
    
    try {
      const conexionExitosa = await this.gestionProductosService.probarConexionFirestore();
      
      if (conexionExitosa) {
        await Swal.fire({
          title: '✅ Conexión Exitosa',
          text: 'La conexión con Firestore está funcionando correctamente. Revisa la consola para más detalles.',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } else {
        await Swal.fire({
          title: '❌ Error de Conexión',
          text: 'Hubo un problema con la conexión a Firestore. Revisa la consola para más detalles.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      console.error('Error en la prueba de conexión:', error);
      await Swal.fire({
        title: '❌ Error Crítico',
        text: 'Error crítico durante la prueba de conexión. Revisa la consola para más detalles.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  /**
   * Cancela la edición y oculta el formulario
   * Restaura el estado inicial del componente
   */
  cancelarFormulario(): void {
    this.mostrarFormulario = false;              // Oculta el formulario
    this.modoEdicion = false;                    // Resetea el modo
    this.productoSeleccionado = null;            // Limpia la selección
    this.limpiarFormulario();                    // Limpia los campos
    console.log('Formulario cancelado');
  }

  // --- MÉTODOS AUXILIARES PRIVADOS ---

  /**
   * Limpia todos los campos del formulario restaurando valores por defecto
   */
  private limpiarFormulario(): void {
    this.formularioProducto = {
      nombre: '',        // Campo vacío
      descripcion: '',   // Campo vacío
      precio: 0,         // Precio en cero
      categoria: '',     // Sin categoría seleccionada
      stock: 0,          // Stock en cero
      imagen: '',        // Sin imagen
      activo: true       // Activo por defecto
    };
    console.log('Formulario limpiado');
  }

  /**
   * Carga los datos de un producto existente en el formulario para edición
   * @param producto - El producto cuyos datos se cargarán
   */
  private cargarDatosEnFormulario(producto: Producto): void {
    this.formularioProducto = {
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio || 0,
      categoria: producto.categoria || '',
      stock: producto.stock || 0,
      imagen: producto.imagen || '',
      activo: producto.activo !== undefined ? producto.activo : true
    };
    console.log('Datos cargados en formulario para:', producto.nombre);
  }

  /**
   * Valida que los campos requeridos del formulario estén completos
   * @returns true si el formulario es válido, false en caso contrario
   */
  private validarFormulario(): boolean {
    const { nombre, precio, categoria } = this.formularioProducto;
    
    // Validar campos requeridos
    if (!nombre.trim()) {
      console.error('El nombre del producto es requerido');
      return false;
    }
    
    if (precio <= 0) {
      console.error('El precio debe ser mayor a cero');
      return false;
    }
    
    if (!categoria.trim()) {
      console.error('La categoría es requerida');
      return false;
    }
    
    return true;
  }

  /**
   * Crea un nuevo producto en la base de datos
   * Utiliza los datos del formulario para crear el producto
   */
  private crearProducto(): void {
    console.log('Creando nuevo producto:', this.formularioProducto);
    
    // Convertimos el formulario a un objeto Producto
    const nuevoProducto: Producto = {
      nombre: this.formularioProducto.nombre,
      descripcion: this.formularioProducto.descripcion,
      precio: this.formularioProducto.precio,
      categoria: this.formularioProducto.categoria,
      stock: this.formularioProducto.stock,
      imagen: this.formularioProducto.imagen,
      activo: this.formularioProducto.activo
    };

    this.gestionProductosService.crearProducto(nuevoProducto).subscribe({
      next: (id) => {
        console.log('Producto creado con ID:', id);
        this.cancelarFormulario();
        Swal.fire('Éxito', 'Producto creado correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al crear producto:', error);
        Swal.fire('Error', 'No se pudo crear el producto', 'error');
      }
    });
  }

  /**
   * Actualiza un producto existente en la base de datos
   * Utiliza los datos del formulario para actualizar el producto seleccionado
   */
  private actualizarProducto(): void {
    if (!this.productoSeleccionado?.id) {
      console.error('No hay producto seleccionado para actualizar');
      return;
    }
    
    console.log('Actualizando producto:', this.productoSeleccionado.id, this.formularioProducto);
    
    // Preparamos los datos de actualización
    const datosActualizacion: Partial<Producto> = {
      nombre: this.formularioProducto.nombre,
      descripcion: this.formularioProducto.descripcion,
      precio: this.formularioProducto.precio,
      categoria: this.formularioProducto.categoria,
      stock: this.formularioProducto.stock,
      imagen: this.formularioProducto.imagen,
      activo: this.formularioProducto.activo
    };

    this.gestionProductosService.actualizarProducto(this.productoSeleccionado.id, datosActualizacion).subscribe({
      next: () => {
        console.log('Producto actualizado correctamente');
        this.cancelarFormulario();
        Swal.fire('Éxito', 'Producto actualizado correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al actualizar producto:', error);
        Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
      }
    });
  }
}