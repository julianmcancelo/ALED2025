/**
 * COMPONENTE DE GESTIÓN DE PRODUCTOS CON SUPABASE
 * 
 * Este componente maneja toda la funcionalidad de productos usando Supabase
 * Incluye CRUD completo, tiempo real, IA con Gemini y storage integrado
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// SERVICIOS DE SUPABASE
import { ProductosSupabaseService, ProductoConCategoria } from '../../servicios/productos-supabase.service';
import { StorageSupabaseService, RespuestaUpload, RespuestaIA } from '../../servicios/storage-supabase.service';
import { CategoriaService, Categoria as CategoriaInterface } from '../../servicios/categoria.service';
import { SupabaseCategoria, SupabaseProducto } from '../../config/supabase.config';

import Swal from 'sweetalert2';

// TIPOS PARA COMPATIBILIDAD
type Producto = ProductoConCategoria;
type Categoria = CategoriaInterface;

@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-productos.html',
  styleUrl: './gestion-productos.css',
})
export class GestionProductos implements OnInit, OnDestroy {
  // --- INYECCIÓN DE DEPENDENCIAS SUPABASE ---
  private productosService = inject(ProductosSupabaseService);
  private storageService = inject(StorageSupabaseService);
  private categoriaService = inject(CategoriaService);

  // --- SUSCRIPCIONES PARA TIEMPO REAL ---
  private subscriptions: Subscription[] = [];

  // --- PROPIEDADES DE PRODUCTOS ---
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  mostrarFormulario: boolean = false;
  modoEdicion: boolean = false;
  
  formularioProducto = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: '', // Para compatibilidad con template
    categoria_id: null as string | null, // Inicializar como null para evitar errores de BD
    stock: 0,
    imagen: '', // Para compatibilidad con template
    imagen_url: '',
    activo: true,
    esDestacado: false, // Para compatibilidad con template
    es_destacado: false
  };

  // --- PROPIEDADES DE CATEGORÍAS ---
  categorias: Categoria[] = [];
  mostrarGestionCategorias: boolean = false;
  categoriaEnEdicion: Categoria | null = null;
  nombreNuevaCategoria: string = '';

  // --- PROPIEDADES DE IMAGEN ---
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  subiendoImagen: boolean = false;
  mostrarSelectorImagen: boolean = false;
  archivoSeleccionado: File | null = null;
  previsualizacionImagen: string | null = null;

  // --- PROPIEDADES DE IA ---
  procesandoIA: boolean = false;
  mostrarModalIA: boolean = false;
  imagenOriginalIA: string | null = null;
  imagenProcesadaIA: string | null = null;
  analisisIA: any = null;
  analizandoConGemini: boolean = false;
  procesandoFondo: boolean = false;
  probandoConexion: boolean = false;
  resultadoGemini: any = null;
  mostrarOpcionesIA: boolean = false;

  ngOnInit(): void {
    console.log('🚀 Iniciando componente de gestión de productos con Supabase');
    this.cargarDatos();
    this.suscribirTiempoReal();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // --- MÉTODOS DE INICIALIZACIÓN ---
  
  private cargarDatos(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  private suscribirTiempoReal(): void {
    // Suscribirse a cambios en productos
    const productosSubscription = this.productosService.obtenerProductos().subscribe({
      next: (productos: Producto[]) => {
        console.log(`✅ Productos cargados desde Supabase: ${productos.length}`);
        this.productos = productos;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar productos:', error);
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    });

    this.subscriptions.push(productosSubscription);
  }

  private cargarProductos(): void {
    // Los productos se cargan automáticamente por la suscripción
    console.log('🔄 Cargando productos con tiempo real...');
  }

  private cargarCategorias(): void {
    // Cargar categorías desde Supabase
    this.categoriaService.obtenerCategorias().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        console.log('✅ Categorías cargadas:', categorias.length);
      },
      error: (error) => {
        console.error('❌ Error cargando categorías:', error);
        this.categorias = [];
      }
    });
  }

  // --- MÉTODOS DE PRODUCTOS ---

  nuevoProducto(): void {
    this.resetearFormularioProducto();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
  }

  editarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.formularioProducto = {
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      categoria: producto.categoria?.nombre || '',
      categoria_id: producto.categoria_id,
      stock: producto.stock || 0,
      imagen: producto.imagen_url || '',
      imagen_url: producto.imagen_url || '',
      activo: producto.activo,
      esDestacado: producto.es_destacado || false,
      es_destacado: producto.es_destacado || false
    };
    this.imagenPreview = producto.imagen_url || null;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
  }

  async guardarProducto(): Promise<void> {
    if (!this.validarFormularioProducto()) return;

    const datosProducto = {
      nombre: this.formularioProducto.nombre,
      descripcion: this.formularioProducto.descripcion,
      precio: this.formularioProducto.precio,
      categoria_id: this.formularioProducto.categoria_id,
      stock: this.formularioProducto.stock,
      imagen_url: this.formularioProducto.imagen_url,
      activo: this.formularioProducto.activo,
      es_destacado: this.formularioProducto.es_destacado
    };

    try {
      if (this.modoEdicion && this.productoSeleccionado?.id) {
        // Actualizar producto existente
        await this.productosService.actualizarProducto(this.productoSeleccionado.id, datosProducto).toPromise();
        
        Swal.fire({
          title: '¡Actualizado!',
          text: `El producto "${datosProducto.nombre}" ha sido actualizado correctamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear nuevo producto
        await this.productosService.crearProducto(datosProducto).toPromise();
        
        Swal.fire({
          title: '¡Creado!',
          text: `El producto "${datosProducto.nombre}" ha sido creado correctamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      this.cerrarFormulario();
    } catch (error: any) {
      console.error('❌ Error al guardar producto:', error);
      
      let mensajeError = 'No se pudo guardar el producto. Intenta nuevamente.';
      
      // Proporcionar mensajes más específicos según el tipo de error
      if (error.message) {
        if (error.message.includes('categoria_id')) {
          mensajeError = 'Error con la categoría seleccionada. Verifica que sea válida.';
        } else if (error.message.includes('foreign key')) {
          mensajeError = 'La categoría seleccionada no existe. Selecciona una categoría válida.';
        } else if (error.message.includes('not null')) {
          mensajeError = 'Faltan campos obligatorios. Verifica nombre, precio y categoría.';
        } else {
          mensajeError = `Error: ${error.message}`;
        }
      }
      
      Swal.fire({
        title: 'Error al Guardar',
        text: mensajeError,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  }

  async eliminarProducto(producto: Producto): Promise<void> {
    if (!producto.id) {
      Swal.fire('Error', 'No se puede eliminar un producto sin ID válido.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás "${producto.nombre}". ¡No podrás revertir esto!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (result.isConfirmed) {
      try {
        await this.productosService.eliminarProducto(producto.id).toPromise();
        
        Swal.fire({
          title: '¡Eliminado!',
          text: `El producto "${producto.nombre}" ha sido eliminado correctamente.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        console.error('❌ Error al eliminar producto:', error);
        Swal.fire({
          title: 'Error al Eliminar',
          text: `No se pudo eliminar el producto "${producto.nombre}". Intenta nuevamente.`,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    }
  }

  // --- MÉTODOS PARA COMPATIBILIDAD CON TEMPLATE ---
  
  abrirSelectorImagen(): void {
    this.mostrarSelectorImagen = true;
  }

  cerrarSelectorImagen(): void {
    this.mostrarSelectorImagen = false;
    this.archivoSeleccionado = null;
    this.previsualizacionImagen = null;
  }

  onArchivoSeleccionado(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      this.imagenSeleccionada = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previsualizacionImagen = e.target.result;
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagen(): void {
    this.formularioProducto.imagen = '';
    this.formularioProducto.imagen_url = '';
    this.imagenPreview = null;
    this.previsualizacionImagen = null;
  }

  abrirOpcionesIA(): void {
    this.mostrarOpcionesIA = true;
  }

  cerrarOpcionesIA(): void {
    this.mostrarOpcionesIA = false;
  }

  // Método removido - duplicado más abajo con implementación real

  async borrarFondoRealConGemini(): Promise<void> {
    if (!this.archivoSeleccionado) {
      Swal.fire('Error', 'Primero selecciona una imagen', 'warning');
      return;
    }
    
    this.procesandoFondo = true;
    try {
      console.log('🎨 Procesando imagen con borrado de fondo...');
      const resultado = await this.storageService.procesarImagenConCanvas(this.archivoSeleccionado).toPromise();
      
      if (resultado?.success && resultado.url) {
        this.formularioProducto.imagen_url = resultado.url;
        console.log('✅ Imagen procesada con éxito');
        
        Swal.fire({
          title: '¡Imagen Procesada!',
          text: 'La imagen ha sido procesada y aplicada al formulario.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(resultado?.error || 'Error procesando imagen');
      }
    } catch (error: any) {
      console.error('❌ Error al procesar imagen:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo procesar la imagen: ' + error.message,
        icon: 'error'
      });
    } finally {
      this.procesandoFondo = false;
    }
  }

  async borrarFondoConGemini(): Promise<void> {
    await this.borrarFondoRealConGemini();
  }

  async generarDescripcionGemini(): Promise<void> {
    if (!this.archivoSeleccionado) return;
    this.analizandoConGemini = true;
    try {
      console.log('🤖 Generando descripción con Gemini AI...');
      const resultado = await this.storageService.analizarConGemini(this.archivoSeleccionado).toPromise();
      
      if (resultado?.success) {
        this.formularioProducto.descripcion = resultado.descripcion || '';
        console.log('✅ Descripción generada:', resultado.descripcion);
        
        Swal.fire({
          title: '¡Descripción Generada!',
          text: 'La descripción ha sido generada con IA y aplicada al formulario.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(resultado?.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('❌ Error generando descripción:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar la descripción: ' + error.message,
        icon: 'error'
      });
    } finally {
      this.analizandoConGemini = false;
    }
  }

  async sugerirPrecioGemini(): Promise<void> {
    if (!this.archivoSeleccionado) return;
    this.analizandoConGemini = true;
    try {
      console.log('💰 Sugiriendo precio con Gemini AI...');
      const resultado = await this.storageService.analizarConGemini(this.archivoSeleccionado).toPromise();
      
      if (resultado?.success && resultado.precio) {
        this.formularioProducto.precio = resultado.precio;
        console.log('✅ Precio sugerido:', resultado.precio);
        
        Swal.fire({
          title: '¡Precio Sugerido!',
          text: `Precio sugerido: $${resultado.precio}\n${resultado.justificacionPrecio || ''}`,
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        throw new Error(resultado?.error || 'No se pudo obtener precio');
      }
    } catch (error: any) {
      console.error('❌ Error sugiriendo precio:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo sugerir el precio: ' + error.message,
        icon: 'error'
      });
    } finally {
      this.analizandoConGemini = false;
    }
  }

  async probarConexionGemini(): Promise<void> {
    this.probandoConexion = true;
    try {
      console.log('🔍 Probando conexión con Gemini AI...');
      const disponible = await this.storageService.verificarGeminiDisponible().toPromise();
      
      if (disponible) {
        console.log('✅ Conexión exitosa con Gemini AI');
        Swal.fire({
          title: '¡Conexión Exitosa!',
          text: 'Gemini AI 2.5 Flash está disponible y funcionando correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('Gemini AI no está disponible');
      }
    } catch (error: any) {
      console.error('❌ Error probando conexión:', error);
      Swal.fire({
        title: 'Error de Conexión',
        text: 'No se pudo conectar con Gemini AI: ' + error.message,
        icon: 'error'
      });
    } finally {
      this.probandoConexion = false;
    }
  }

  async analizarConGeminiIA(): Promise<void> {
    if (!this.archivoSeleccionado) {
      Swal.fire('Error', 'Primero selecciona una imagen', 'warning');
      return;
    }
    
    this.analizandoConGemini = true;
    this.resultadoGemini = null;
    
    try {
      console.log('🤖 Analizando producto con Gemini AI...');
      const resultado = await this.storageService.analizarConGemini(this.archivoSeleccionado).toPromise();
      
      if (resultado?.success) {
        this.resultadoGemini = resultado;
        console.log('✅ Análisis completado:', resultado);
        
        Swal.fire({
          title: '¡Análisis Completo!',
          html: `
            <strong>Producto:</strong> ${resultado.nombre}<br>
            <strong>Categoría:</strong> ${resultado.categoria}<br>
            <strong>Precio:</strong> $${resultado.precio}<br>
            <strong>Descripción:</strong> ${resultado.descripcion?.substring(0, 100)}...
          `,
          icon: 'success',
          confirmButtonText: 'Ver Detalles'
        });
      } else {
        throw new Error(resultado?.error || 'Error en el análisis');
      }
    } catch (error: any) {
      console.error('❌ Error analizando con IA:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo analizar el producto: ' + error.message,
        icon: 'error'
      });
    } finally {
      this.analizandoConGemini = false;
    }
  }

  async aplicarDatosGemini(): Promise<void> {
    if (!this.resultadoGemini) {
      Swal.fire('Error', 'Primero analiza la imagen con Gemini AI', 'warning');
      return;
    }
    
    try {
      // Aplicar todos los datos al formulario
      this.formularioProducto.nombre = this.resultadoGemini.nombre || '';
      this.formularioProducto.descripcion = this.resultadoGemini.descripcion || '';
      this.formularioProducto.precio = this.resultadoGemini.precio || 0;
      
      // Buscar categoría por nombre
      const categoriaEncontrada = this.categorias.find(cat => 
        cat.nombre.toLowerCase().includes(this.resultadoGemini.categoria?.toLowerCase() || '')
      );
      if (categoriaEncontrada) {
        this.formularioProducto.categoria_id = categoriaEncontrada.id!;
      }
      
      console.log('✅ Datos aplicados al formulario desde resultadoGemini');
      
      Swal.fire({
        title: '¡Datos Aplicados!',
        text: 'Los datos del análisis de IA han sido aplicados al formulario.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      // Cerrar modal de IA
      this.cerrarOpcionesIA();
      
    } catch (error: any) {
      console.error('❌ Error aplicando datos:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron aplicar los datos: ' + error.message,
        icon: 'error'
      });
    }
  }

  cancelarFormulario(): void {
    this.cerrarFormulario();
  }

  // --- MÉTODOS DE CATEGORÍAS ---

  async guardarCategoria(): Promise<void> {
    if (!this.nombreNuevaCategoria.trim()) {
      Swal.fire('Error', 'El nombre de la categoría es obligatorio', 'error');
      return;
    }

    try {
      if (this.categoriaEnEdicion) {
        // Actualizar categoría existente usando Supabase
        await this.categoriaService.actualizarCategoria(this.categoriaEnEdicion.id!, this.nombreNuevaCategoria);
        
        Swal.fire({
          title: '¡Actualizada!',
          text: `La categoría "${this.nombreNuevaCategoria}" ha sido actualizada.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear nueva categoría usando Supabase
        await this.categoriaService.crearCategoria(this.nombreNuevaCategoria);
        
        Swal.fire({
          title: '¡Creada!',
          text: `La categoría "${this.nombreNuevaCategoria}" ha sido creada.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      // Recargar categorías después de guardar
      this.cargarCategorias();
      this.cancelarEdicionCategoria();
    } catch (error: any) {
      console.error('❌ Error al guardar categoría:', error);
      Swal.fire({
        title: 'Error al Guardar',
        text: 'No se pudo guardar la categoría. Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    }
  }

  editarCategoria(categoria: Categoria): void {
    this.categoriaEnEdicion = categoria;
    this.nombreNuevaCategoria = categoria.nombre;
  }

  async eliminarCategoria(categoria: Categoria): Promise<void> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás la categoría "${categoria.nombre}". ¡No podrás revertir esto!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (result.isConfirmed) {
      try {
        // Eliminar usando el servicio real de Supabase
        await this.categoriaService.eliminarCategoria(categoria.id!);
        
        // Recargar categorías después de eliminar
        this.cargarCategorias();
        
        Swal.fire({
          title: '¡Eliminada!',
          text: `La categoría "${categoria.nombre}" ha sido eliminada.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error: any) {
        console.error('❌ Error al eliminar categoría:', error);
        Swal.fire({
          title: 'Error al Eliminar',
          text: `No se pudo eliminar la categoría "${categoria.nombre}".`,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    }
  }

  cancelarEdicionCategoria(): void {
    this.categoriaEnEdicion = null;
    this.nombreNuevaCategoria = '';
  }

  generarPlaceholder(): void {
    const nombreProducto = this.formularioProducto.nombre || 'Producto';
    this.formularioProducto.imagen_url = `https://via.placeholder.com/400x300/e9ecef/6c757d?text=${encodeURIComponent(nombreProducto)}`;
    this.imagenPreview = this.formularioProducto.imagen_url;
    
    Swal.fire({
      title: 'Placeholder Generado',
      text: 'Se ha generado una imagen placeholder temporal.',
      icon: 'info',
      timer: 2000,
      showConfirmButton: false
    });
  }

  async subirImagen(): Promise<void> {
    if (!this.imagenSeleccionada) {
      Swal.fire('Error', 'Selecciona una imagen primero', 'error');
      return;
    }

    this.subiendoImagen = true;

    try {
      const respuesta = await this.storageService.subirImagen(this.imagenSeleccionada, 'productos').toPromise();
      
      if (respuesta && respuesta.url) {
        this.formularioProducto.imagen_url = respuesta.url;
        this.imagenPreview = respuesta.url;
        
        Swal.fire({
          title: '¡Imagen Subida!',
          text: 'La imagen se ha subido correctamente a Supabase Storage.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        this.cerrarSelectorImagen();
      }
    } catch (error: any) {
      console.error('❌ Error al subir imagen:', error);
      Swal.fire({
        title: 'Error al Subir',
        text: 'No se pudo subir la imagen. Intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.subiendoImagen = false;
    }
  }

  // --- MÉTODOS DE UTILIDAD ---

  private validarFormularioProducto(): boolean {
    if (!this.formularioProducto.nombre.trim()) {
      Swal.fire('Error', 'El nombre del producto es obligatorio', 'error');
      return false;
    }
    
    if (this.formularioProducto.precio <= 0) {
      Swal.fire('Error', 'El precio debe ser mayor a 0', 'error');
      return false;
    }
    
    if (!this.formularioProducto.categoria_id) {
      Swal.fire('Error', 'Debes seleccionar una categoría', 'error');
      return false;
    }
    
    return true;
  }

  private resetearFormularioProducto(): void {
    this.formularioProducto = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: '',
      categoria_id: null, // Inicializar como null
      stock: 0,
      imagen: '',
      imagen_url: '',
      activo: true,
      esDestacado: false,
      es_destacado: false
    };
    this.imagenPreview = null;
    this.imagenSeleccionada = null;
    this.productoSeleccionado = null;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.resetearFormularioProducto();
  }

  // --- MÉTODOS DE ESTADÍSTICAS ---

  get totalProductos(): number {
    return this.productos.length;
  }

  get productosActivos(): number {
    return this.productos.filter(p => p.activo).length;
  }

  get productosDestacados(): number {
    return this.productos.filter(p => p.es_destacado).length;
  }
}
