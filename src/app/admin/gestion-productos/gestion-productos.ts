import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionProductosService, Producto } from '../../servicios/gestion-productos.service';
import { Categoria, CategoriaService } from '../../servicios/categoria.service'; // Importar servicio y modelo de categoría
import { GeminiAiService, ResultadoGemini } from '../../servicios/gemini-ai.service'; // Importar Gemini AI
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
  private geminiAiService = inject(GeminiAiService); // Inyectar Gemini AI

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

  // --- PROPIEDADES DE GEMINI AI ---
  imagenSeleccionada: string | null = null;
  analizandoConGemini: boolean = false;
  resultadoGemini: ResultadoGemini | null = null;
  geminiConfigurado: boolean = false;

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias(); // Cargar categorías al iniciar
    this.verificarGeminiAI(); // Verificar configuración de Gemini AI
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
    if (!producto.id) {
      Swal.fire('Error', 'El producto no tiene un ID válido', 'error');
      return;
    }
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás "${producto.nombre}". ¡No podrás revertir esto!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      this.gestionProductosService.eliminarProducto(producto.id).subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p.id !== producto.id);
          
          Swal.fire('¡Eliminado!', 'El producto ha sido eliminado.', 'success');
          
          // También recargar desde Firebase para asegurar sincronización
          this.cargarProductos();
        },
        error: (error) => {
          console.error('❌ Error al eliminar producto:', error);
          console.error('❌ Detalles del error:', error);
          Swal.fire('Error', `No se pudo eliminar el producto: ${error.message || 'Error desconocido'}`, 'error');
        }
      });
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

  // --- MÉTODOS DE GEMINI AI ---

  /**
   * Verifica si Gemini AI está configurado correctamente
   */
  verificarGeminiAI(): void {
    this.geminiConfigurado = this.geminiAiService.verificarConfiguracion();
    // Gemini AI configurado
  }

  /**
   * Diagnóstico completo del sistema Gemini AI
   */
  diagnosticarGeminiAI(): void {
    const estadoServicio = this.geminiAiService.obtenerEstadoServicio();
    const configurado = this.geminiAiService.verificarConfiguracion();
    
    Swal.fire({
      title: '🔍 Diagnóstico Gemini AI',
      html: `
        <div class="text-start">
          <p><strong>🤖 Modelo:</strong> ${estadoServicio.modelo}</p>
          <p><strong>🔑 API Key:</strong> ${estadoServicio.configurado ? '✅ Configurada' : '❌ No configurada'}</p>
          <p><strong>🌐 Endpoint:</strong> ${estadoServicio.endpoint}</p>
          <p><strong>⚙️ Estado:</strong> ${this.geminiConfigurado ? '✅ Listo' : '❌ No disponible'}</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '🧪 Probar Conexión Real',
      cancelButtonText: 'Cerrar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.probarConexionGemini();
      }
    });
  }

  /**
   * Prueba análisis por texto como alternativa
   */
  probarAnalisisTexto(): void {
    console.log('📝 Probando análisis por texto...');
    
    const descripcionPrueba = this.formularioProducto.nombre || 'Producto de prueba';
    
    Swal.fire({
      title: 'Probando Análisis por Texto',
      text: `Analizando: "${descripcionPrueba}"`,
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.geminiAiService.analizarTexto(descripcionPrueba).subscribe({
      next: (resultado) => {
        console.log('✅ Análisis por texto completado:', resultado);
        
        Swal.fire({
          title: '✅ Análisis por Texto Exitoso',
          html: `
            <div class="text-start">
              <p><strong>Nombre:</strong> ${resultado.nombre || 'N/A'}</p>
              <p><strong>Categoría:</strong> ${resultado.categoria || 'N/A'}</p>
              <p><strong>Precio:</strong> $${resultado.precio || 'N/A'}</p>
              <p><strong>Confianza:</strong> ${resultado.confianza || 'N/A'}%</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Perfecto'
        });
      },
      error: (error) => {
        console.error('❌ Error en análisis por texto:', error);
        Swal.fire({
          title: '❌ Error en Análisis por Texto',
          text: `Error: ${error.message || 'Problema de conectividad'}`,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Prueba la conexión con Gemini AI
   */
  probarConexionGemini(): void {
    console.log('🧪 Probando conexión con Gemini AI...');
    
    Swal.fire({
      title: 'Probando Gemini AI',
      text: 'Verificando conexión con Google Gemini 2.5 Flash...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.geminiAiService.probarConexion().subscribe({
      next: (resultado) => {
        console.log('✅ Prueba de conexión completada:', resultado);
        
        if (resultado) {
          Swal.fire({
            title: '✅ Conexión Exitosa',
            text: 'Gemini AI 2.5 Flash está funcionando correctamente',
            icon: 'success',
            confirmButtonText: 'Perfecto'
          });
        } else {
          Swal.fire({
            title: '❌ Error de Conexión',
            text: 'No se pudo conectar con Gemini AI. Verifica la API Key.',
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
        }
      },
      error: (error) => {
        console.error('❌ Error en prueba de conexión:', error);
        
        let errorDetallado = 'Error desconocido';
        if (error.status) {
          errorDetallado = `HTTP ${error.status}: ${error.statusText || error.message}`;
        } else if (error.message) {
          errorDetallado = error.message;
        }
        
        Swal.fire({
          title: '❌ Error de Conexión',
          html: `
            <div class="text-start">
              <p><strong>Error:</strong> ${errorDetallado}</p>
              <p><strong>Consola:</strong> Revisa la consola del navegador (F12) para más detalles</p>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Maneja la selección de imagen para análisis con Gemini
   */
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('📷 Imagen seleccionada:', file.name);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenSeleccionada = e.target.result;
        console.log('✅ Imagen cargada para análisis');
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Analiza la imagen seleccionada con Gemini AI
   */
  analizarConGeminiIA(tipoAnalisis: 'completo' | 'descripcion' | 'precio' = 'completo'): void {
    if (!this.imagenSeleccionada) {
      Swal.fire('Error', 'Primero debes seleccionar una imagen', 'error');
      return;
    }

    if (!this.geminiConfigurado) {
      Swal.fire({
        title: 'API Key Requerida',
        text: 'Gemini AI requiere una API Key válida para funcionar. Contacta al administrador del sistema.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    console.log(`🤖 Iniciando análisis REAL ${tipoAnalisis} con Gemini 2.5 Flash...`);
    console.log('🚀 Modelo: Gemini 2.5 Flash (más reciente y potente)');
    console.log('🌍 Mercado objetivo: Argentina 2025');
    this.analizandoConGemini = true;

    this.geminiAiService.analizarProducto(this.imagenSeleccionada, tipoAnalisis).subscribe({
      next: (resultado) => {
        console.log('✅ Análisis REAL completado:', resultado);
        console.log('💰 Precio sugerido para Argentina 2025: $', resultado.precio.toLocaleString());
        this.resultadoGemini = resultado;
        this.analizandoConGemini = false;
        this.mostrarResultadoGemini(resultado, tipoAnalisis);
      },
      error: (error) => {
        console.error('❌ Error REAL en Gemini AI:', error);
        this.analizandoConGemini = false;
        
        // Mostrar error específico sin fallback
        const errorMessage = error.message || 'Error de conexión con Gemini AI';
        Swal.fire({
          title: 'Error en Gemini AI',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'Reintentar',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            // Reintentar automáticamente
            setTimeout(() => this.analizarConGeminiIA(tipoAnalisis), 1000);
          }
        });
      }
    });
  }

  /**
   * Muestra el resultado del análisis de Gemini en un modal
   */
  private mostrarResultadoGemini(resultado: ResultadoGemini, tipoAnalisis: string): void {
    const tipoTexto = {
      completo: 'Análisis Completo',
      descripcion: 'Descripción Generada',
      precio: 'Precio Sugerido'
    }[tipoAnalisis] || 'Análisis';

    let contenidoHtml = `
      <div class="text-start">
        <div class="row">
          <div class="col-5">
            <img src="${this.imagenSeleccionada}" class="img-fluid rounded" alt="Producto analizado">
          </div>
          <div class="col-7">
    `;

    if (tipoAnalisis === 'completo') {
      contenidoHtml += `
        <h6><strong>📦 Nombre:</strong></h6>
        <p class="mb-2">${resultado.nombre}</p>
        
        <h6><strong>🏷️ Categoría:</strong></h6>
        <p class="mb-2"><span class="badge bg-primary">${resultado.categoria}</span></p>
        
        <h6><strong>💰 Precio Sugerido:</strong></h6>
        <p class="mb-2 text-success fs-5"><strong>$${resultado.precio.toLocaleString()}</strong></p>
        
        <h6><strong>🏷️ Tags:</strong></h6>
        <p class="mb-2">
          ${resultado.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
        </p>
      `;
    }

    if (tipoAnalisis === 'completo' || tipoAnalisis === 'descripcion') {
      contenidoHtml += `
        <h6><strong>📝 Descripción:</strong></h6>
        <div class="alert alert-light mb-2">
          <small>${resultado.descripcion}</small>
        </div>
      `;
    }

    if (tipoAnalisis === 'completo' || tipoAnalisis === 'precio') {
      contenidoHtml += `
        <h6><strong>💡 Justificación del Precio:</strong></h6>
        <div class="alert alert-info mb-2">
          <small>${resultado.justificacion_precio}</small>
        </div>
      `;
    }

    contenidoHtml += `
        <div class="mt-3">
          <small class="text-muted">
            🎯 Confianza: ${resultado.confianza}% | 🤖 Powered by Gemini AI
          </small>
        </div>
      </div>
    </div>
  </div>
    `;

    Swal.fire({
      title: `🚀 ${tipoTexto} REAL - Gemini 2.5 Flash`,
      html: contenidoHtml,
      width: '900px',
      showCancelButton: true,
      confirmButtonText: '✅ Aplicar Datos Reales al Formulario',
      cancelButtonText: '👁️ Solo Visualizar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      footer: '<small class="text-muted">🌍 Análisis para mercado argentino 2025 | 🤖 Powered by Google Gemini AI</small>'
    }).then((result) => {
      if (result.isConfirmed) {
        this.aplicarDatosGemini();
      }
    });
  }

  /**
   * Aplica los datos generados por Gemini al formulario
   */
  aplicarDatosGemini(): void {
    if (!this.resultadoGemini) return;

    console.log('📝 Aplicando datos de Gemini al formulario...');

    // Aplicar datos básicos
    this.formularioProducto.nombre = this.resultadoGemini.nombre;
    this.formularioProducto.descripcion = this.resultadoGemini.descripcion;
    this.formularioProducto.precio = this.resultadoGemini.precio;

    // Buscar categoría por nombre y asignar
    const categoriaEncontrada = this.categorias.find(cat => 
      cat.nombre.toLowerCase().includes(this.resultadoGemini!.categoria.toLowerCase())
    );
    
    if (categoriaEncontrada) {
      this.formularioProducto.categoria = categoriaEncontrada.nombre;
      console.log('✅ Categoría asignada:', categoriaEncontrada.nombre);
    } else {
      // Si no encuentra la categoría, usar la sugerida por Gemini
      this.formularioProducto.categoria = this.resultadoGemini.categoria;
      console.log('⚠️ Categoría no encontrada, usando sugerida:', this.resultadoGemini.categoria);
    }

    // Asignar imagen si está disponible
    if (this.imagenSeleccionada) {
      this.formularioProducto.imagen = this.imagenSeleccionada;
    }

    Swal.fire({
      title: '🚀 Datos Reales Aplicados',
      html: `
        <div class="text-start">
          <p><strong>✅ Análisis completado exitosamente</strong></p>
          <ul class="list-unstyled">
            <li>🏷️ <strong>Nombre:</strong> ${this.resultadoGemini.nombre}</li>
            <li>🏪 <strong>Categoría:</strong> ${this.resultadoGemini.categoria}</li>
            <li>💰 <strong>Precio Argentina 2025:</strong> $${this.resultadoGemini.precio.toLocaleString()}</li>
            <li>🎯 <strong>Confianza:</strong> ${this.resultadoGemini.confianza}%</li>
          </ul>
          <small class="text-muted">Los datos han sido aplicados al formulario y están listos para guardar.</small>
        </div>
      `,
      icon: 'success',
      timer: 4000,
      showConfirmButton: true,
      confirmButtonText: 'Perfecto'
    });

    console.log('✅ Datos de Gemini aplicados al formulario');
  }

  /**
   * Limpia los datos de Gemini AI
   */
  limpiarDatosGemini(): void {
    this.imagenSeleccionada = null;
    this.resultadoGemini = null;
    this.analizandoConGemini = false;
    console.log('🧹 Datos de Gemini AI limpiados');
  }
}
