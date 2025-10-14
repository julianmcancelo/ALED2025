// Importaciones necesarias de Angular y librerías externas
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { NovedadesService, Novedad } from '../../servicios/novedades.service';
import { GeminiIAService, ResultadoGeneracionContenido, ImagenGenerada } from '../../servicios/gemini-ia.service';
import Swal from 'sweetalert2'; // Librería para mostrar alertas elegantes

/**
 * ============================================================================
 * COMPONENTE DE GESTIÓN DE NOVEDADES - PANEL DE ADMINISTRACIÓN
 * ============================================================================
 * 
 * Este componente permite a los administradores gestionar las novedades del sitio,
 * que incluyen banners promocionales, ofertas especiales y anuncios importantes.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Visualizar todas las novedades existentes
 * - Crear nuevas novedades con título, descripción e imagen
 * - Editar novedades existentes
 * - Eliminar novedades con confirmación
 * - Validación de campos obligatorios
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */
@Component({
  selector: 'app-gestion-novedades',
  standalone: true, // Componente independiente, no requiere módulo
  imports: [CommonModule, FormsModule], // Módulos necesarios para funcionalidad
  templateUrl: './gestion-novedades.html',
  styleUrls: ['./gestion-novedades.css'],
})
export class GestionNovedadesComponent implements OnInit {
  
  // --- INYECCIÓN DE DEPENDENCIAS ---
  // Inyectamos el servicio de novedades para interactuar con la base de datos
  private novedadesService = inject(NovedadesService);
  // Inyectamos el servicio de Gemini IA para funcionalidades inteligentes
  private geminiService = inject(GeminiIAService);

  // --- PROPIEDADES DEL COMPONENTE ---
  
  /**
   * Observable que contiene la lista de novedades en tiempo real.
   * Se actualiza automáticamente cuando hay cambios en la base de datos.
   */
  novedades$!: Observable<Novedad[]>;
  
  /**
   * Controla si se muestra el formulario de creación/edición.
   * true = formulario visible, false = formulario oculto
   */
  mostrarFormulario = false;
  
  /**
   * Objeto que contiene los datos de la novedad que se está creando o editando.
   * Usa Partial<Novedad> porque no todos los campos son requeridos inicialmente.
   */
  novedadActual: Partial<Novedad> = {};
  
  /**
   * Indica si estamos en modo edición (true) o creación (false).
   * Esto determina qué operación se ejecutará al guardar.
   */
  esModoEdicion = false;

  // --- PROPIEDADES PARA IA ---
  
  /**
   * Controla si se está generando contenido con IA
   */
  generandoConIA = signal(false);
  
  /**
   * Controla si se está generando imagen con IA
   */
  generandoImagen = signal(false);
  
  /**
   * Idea o concepto del usuario para generar contenido
   */
  ideaUsuario = '';
  
  /**
   * Prompt para generar imagen
   */
  promptImagen = '';

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---
  
  /**
   * Método que se ejecuta automáticamente cuando el componente se inicializa.
   * Aquí configuramos la suscripción a las novedades para obtener datos en tiempo real.
   */
  ngOnInit(): void {
    // Obtenemos el Observable de novedades desde la base de datos
    // Esto nos permite recibir actualizaciones automáticas cuando cambian los datos
    this.novedades$ = this.novedadesService.getNovedades();
  }

  // --- MÉTODOS DE GESTIÓN DEL FORMULARIO ---

  /**
   * Prepara el formulario para crear una nueva novedad.
   * Resetea todos los campos y configura el modo de creación.
   */
  iniciarNuevo(): void {
    // Establecemos que NO estamos editando, sino creando
    this.esModoEdicion = false;
    
    // Inicializamos el objeto con campos vacíos para una nueva novedad
    this.novedadActual = { 
      titulo: '',        // Título de la novedad (requerido)
      descripcion: '',   // Descripción detallada (opcional)
      imagenUrl: '',     // URL de la imagen (requerido)
      enlaceUrl: ''      // URL de destino cuando se hace clic (opcional)
    };
    
    // Mostramos el formulario al usuario
    this.mostrarFormulario = true;
  }

  /**
   * Prepara el formulario para editar una novedad existente.
   * Carga los datos actuales de la novedad en el formulario.
   * 
   * @param novedad - La novedad que se va a editar
   */
  iniciarEdicion(novedad: Novedad): void {
    // Establecemos que SÍ estamos editando
    this.esModoEdicion = true;
    
    // Copiamos todos los datos de la novedad seleccionada al formulario
    // Usamos el spread operator (...) para crear una copia, no una referencia
    this.novedadActual = { ...novedad };
    
    // Mostramos el formulario con los datos cargados
    this.mostrarFormulario = true;
  }

  /**
   * Cancela la operación actual (crear o editar) y oculta el formulario.
   * No guarda ningún cambio realizado.
   */
  cancelar(): void {
    // Simplemente ocultamos el formulario
    // Los datos en novedadActual se perderán, pero eso es lo esperado al cancelar
    this.mostrarFormulario = false;
  }

  // --- MÉTODOS DE PERSISTENCIA DE DATOS ---

  /**
   * Guarda una novedad en la base de datos (crear nueva o actualizar existente).
   * Realiza validaciones antes de guardar y maneja errores apropiadamente.
   * 
   * @returns Promise<void> - Operación asíncrona que no retorna valor
   */
  async guardarNovedad(): Promise<void> {
    // --- VALIDACIÓN DE CAMPOS OBLIGATORIOS ---
    // Verificamos que los campos esenciales estén completos
    if (!this.novedadActual.titulo || !this.novedadActual.imagenUrl) {
      // Mostramos un error al usuario si faltan campos requeridos
      Swal.fire('Error', 'El título y la URL de la imagen son obligatorios.', 'error');
      return; // Salimos del método sin guardar
    }

    try {
      // --- LÓGICA DE GUARDADO CONDICIONAL ---
      // Determinamos si estamos editando o creando según el modo actual
      
      if (this.esModoEdicion && this.novedadActual.id) {
        // CASO 1: ACTUALIZAR NOVEDAD EXISTENTE
        // Si tenemos un ID, significa que estamos editando una novedad existente
        await this.novedadesService.actualizarNovedad(
          this.novedadActual.id,           // ID de la novedad a actualizar
          this.novedadActual               // Nuevos datos a guardar
        );
        
        // Confirmamos al usuario que la actualización fue exitosa
        Swal.fire('¡Actualizado!', 'La novedad ha sido actualizada.', 'success');
        
      } else {
        // CASO 2: CREAR NUEVA NOVEDAD
        // Si no hay ID, estamos creando una novedad completamente nueva
        await this.novedadesService.crearNovedad(this.novedadActual as Novedad);
        
        // Confirmamos al usuario que la creación fue exitosa
        Swal.fire('¡Creado!', 'La nueva novedad ha sido creada.', 'success');
      }
      
      // --- LIMPIEZA POST-GUARDADO ---
      // Ocultamos el formulario después de guardar exitosamente
      this.mostrarFormulario = false;
      
      // NOTA: No necesitamos recargar manualmente la lista de novedades
      // porque usamos un Observable que se actualiza automáticamente
      
    } catch (error) {
      // --- MANEJO DE ERRORES ---
      // Si algo sale mal durante el guardado, informamos al usuario
      console.error('Error al guardar novedad:', error);
      Swal.fire('Error', 'No se pudo guardar la novedad.', 'error');
    }
  }

  /**
   * Elimina una novedad de la base de datos después de confirmación del usuario.
   * Implementa un patrón de confirmación para evitar eliminaciones accidentales.
   * 
   * @param id - ID único de la novedad a eliminar
   * @returns Promise<void> - Operación asíncrona que no retorna valor
   */
  async eliminarNovedad(id: string): Promise<void> {
    // --- CONFIRMACIÓN DE ELIMINACIÓN ---
    // Mostramos un diálogo de confirmación para evitar eliminaciones accidentales
    const result = await Swal.fire({
      title: '¿Estás seguro?',                    // Título del diálogo
      text: '¡No podrás revertir esto!',          // Mensaje de advertencia
      icon: 'warning',                            // Icono de advertencia
      showCancelButton: true,                     // Mostrar botón de cancelar
      confirmButtonText: 'Sí, ¡eliminar!',       // Texto del botón de confirmar
      cancelButtonText: 'Cancelar'               // Texto del botón de cancelar
    });

    // --- PROCESAMIENTO DE LA RESPUESTA ---
    // Solo procedemos si el usuario confirmó la eliminación
    if (result.isConfirmed) {
      try {
        // --- ELIMINACIÓN EN BASE DE DATOS ---
        // Llamamos al servicio para eliminar la novedad de la base de datos
        await this.novedadesService.eliminarNovedad(id);
        
        // --- CONFIRMACIÓN DE ÉXITO ---
        // Informamos al usuario que la eliminación fue exitosa
        Swal.fire('¡Eliminado!', 'La novedad ha sido eliminada.', 'success');
        
        // NOTA: La lista se actualiza automáticamente gracias al Observable
        // No necesitamos recargar manualmente los datos
        
      } catch (error) {
        // --- MANEJO DE ERRORES ---
        // Si la eliminación falla, informamos al usuario
        console.error('Error al eliminar novedad:', error);
        Swal.fire('Error', 'No se pudo eliminar la novedad.', 'error');
      }
    }
    // Si el usuario canceló (result.isConfirmed = false), no hacemos nada
  }

  // --- MÉTODOS DE IA PARA NOVEDADES ---

  /**
   * Genera contenido completo para la novedad usando IA basado en la idea del usuario
   */
  async generarContenidoConIA(): Promise<void> {
    if (!this.ideaUsuario.trim()) {
      Swal.fire('Error', 'Por favor, describe tu idea para la novedad.', 'error');
      return;
    }

    this.generandoConIA.set(true);

    try {
      console.log('🤖 Generando contenido con IA para:', this.ideaUsuario);
      
      // Usar el servicio real de Gemini
      const response = await this.geminiService.generarContenidoNovedad(this.ideaUsuario);
      
      if (response) {
        // Aplicar el contenido generado al formulario
        this.novedadActual.titulo = response.titulo;
        this.novedadActual.descripcion = response.descripcion;
        this.novedadActual.enlaceUrl = response.enlaceUrl;
        this.promptImagen = response.promptImagen;

        Swal.fire({
          icon: 'success',
          title: '¡Contenido generado!',
          text: 'El contenido ha sido generado con IA. Puedes editarlo antes de guardar.',
          timer: 3000
        });
      } else {
        throw new Error('No se recibió respuesta del servicio de IA');
      }

    } catch (error) {
      console.error('Error generando contenido:', error);
      Swal.fire('Error', 'No se pudo generar el contenido con IA.', 'error');
    } finally {
      this.generandoConIA.set(false);
    }
  }

  /**
   * Genera una imagen usando IA basada en el prompt
   */
  async generarImagenConIA(): Promise<void> {
    const prompt = this.promptImagen || this.ideaUsuario;
    
    if (!prompt.trim()) {
      Swal.fire('Error', 'Por favor, describe qué tipo de imagen quieres generar.', 'error');
      return;
    }

    this.generandoImagen.set(true);

    try {
      console.log('🎨 Generando imagen con IA para:', prompt);
      
      // Usar el servicio real de generación de imágenes
      const imagenGenerada = await this.geminiService.generarImagenPromocion(prompt);
      
      if (imagenGenerada) {
        this.novedadActual.imagenUrl = imagenGenerada.url;
        
        Swal.fire({
          icon: 'success',
          title: '¡Imagen generada!',
          html: `
            <p>La imagen ha sido generada con IA.</p>
            <img src="${imagenGenerada.url}" alt="Imagen generada" style="max-width: 300px; border-radius: 8px;">
            <p><small>Tamaño: ${(imagenGenerada.tamaño / 1024).toFixed(1)} KB</small></p>
          `,
          timer: 5000
        });
        
        console.log('✅ Imagen generada exitosamente:', imagenGenerada);
      } else {
        throw new Error('No se pudo generar la imagen');
      }

    } catch (error) {
      console.error('Error generando imagen:', error);
      Swal.fire('Error', 'No se pudo generar la imagen con IA.', 'error');
    } finally {
      this.generandoImagen.set(false);
    }
  }

  /**
   * Mejora el contenido existente usando IA
   */
  async mejorarContenidoConIA(): Promise<void> {
    if (!this.novedadActual.titulo && !this.novedadActual.descripcion) {
      Swal.fire('Error', 'Necesitas tener al menos un título o descripción para mejorar.', 'error');
      return;
    }

    this.generandoConIA.set(true);

    try {
      console.log('🔧 Mejorando contenido existente con IA');
      
      // Crear un prompt para mejorar el contenido existente
      const ideaMejora = `Mejorar este contenido: Título: "${this.novedadActual.titulo || 'Sin título'}" - Descripción: "${this.novedadActual.descripcion || 'Sin descripción'}"`;
      
      const response = await this.geminiService.generarContenidoNovedad(ideaMejora);
      
      if (response) {
        this.novedadActual.titulo = response.titulo;
        this.novedadActual.descripcion = response.descripcion;
        
        // Mantener el enlace existente si no hay uno nuevo relevante
        if (!this.novedadActual.enlaceUrl) {
          this.novedadActual.enlaceUrl = response.enlaceUrl;
        }

        Swal.fire({
          icon: 'success',
          title: '¡Contenido mejorado!',
          text: 'El contenido ha sido optimizado con IA.',
          timer: 3000
        });
      } else {
        throw new Error('No se pudo mejorar el contenido');
      }

    } catch (error) {
      console.error('Error mejorando contenido:', error);
      Swal.fire('Error', 'No se pudo mejorar el contenido con IA.', 'error');
    } finally {
      this.generandoConIA.set(false);
    }
  }


  /**
   * Limpia los campos de IA
   */
  limpiarCamposIA(): void {
    this.ideaUsuario = '';
    this.promptImagen = '';
  }

  /**
   * Método de prueba para verificar generación de imágenes
   */
  async probarGeneracionImagen(): Promise<void> {
    console.log('🧪 Iniciando prueba de generación de imagen...');
    
    try {
      const urlPrueba = await this.geminiService.generarImagenPrueba();
      
      if (urlPrueba) {
        this.novedadActual.imagenUrl = urlPrueba;
        
        Swal.fire({
          icon: 'success',
          title: '¡Prueba exitosa!',
          html: `
            <p>Imagen de prueba generada correctamente.</p>
            <img src="${urlPrueba}" alt="Prueba" style="max-width: 300px; border-radius: 8px;">
          `,
          timer: 5000
        });
        
        console.log('✅ Prueba de imagen exitosa:', urlPrueba);
      } else {
        throw new Error('No se pudo generar imagen de prueba');
      }
      
    } catch (error) {
      console.error('❌ Error en prueba de imagen:', error);
      Swal.fire('Error', 'Falló la prueba de generación de imagen.', 'error');
    }
  }

  // --- NOTAS ARQUITECTÓNICAS ---
  /*
   * PATRÓN DE DISEÑO UTILIZADO:
   * 
   * Este componente implementa el patrón CRUD (Create, Read, Update, Delete) 
   * con las siguientes características:
   * 
   * 1. REACTIVE PROGRAMMING:
   *    - Usa Observables para datos en tiempo real
   *    - La UI se actualiza automáticamente cuando cambian los datos
   * 
   * 2. SEPARATION OF CONCERNS:
   *    - El componente maneja solo la lógica de presentación
   *    - El servicio maneja la lógica de negocio y acceso a datos
   * 
   * 3. USER EXPERIENCE:
   *    - Confirmaciones para operaciones destructivas
   *    - Feedback visual inmediato con SweetAlert2
   *    - Validación de campos obligatorios
   * 
   * 4. ERROR HANDLING:
   *    - Try-catch para operaciones asíncronas
   *    - Mensajes de error user-friendly
   *    - Logging para debugging
   * 
   * 5. ANGULAR BEST PRACTICES:
   *    - Componente standalone para mejor tree-shaking
   *    - Inyección de dependencias con inject()
   *    - Tipado fuerte con TypeScript
   */
}
