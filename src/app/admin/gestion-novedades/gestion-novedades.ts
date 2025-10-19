// Importaciones necesarias de Angular y librerías externas
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { NovedadesService, Novedad } from '../../servicios/novedades.service';
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

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---
  
  /**
   * Método que se ejecuta automáticamente cuando el componente se inicializa.
   * Aquí configuramos la suscripción a las novedades para obtener datos en tiempo real.
   */
  ngOnInit(): void {
    // Obtenemos el Observable de novedades desde la base de datos
    // Esto nos permite recibir actualizaciones automáticas cuando cambian los datos
    console.log('🔄 Inicializando gestión de novedades...');
    
    try {
      this.novedades$ = this.novedadesService.getNovedades();
      
      // Suscripción para debug con manejo de errores
      this.novedades$.subscribe({
        next: (novedades) => {
          console.log('✅ Novedades cargadas en gestión:', novedades);
        },
        error: (error) => {
          console.error('❌ Error cargando novedades en gestión:', error);
          // Fallback a datos vacíos en caso de error
          this.novedades$ = of([]);
        }
      });
    } catch (error) {
      console.error('❌ Error crítico inicializando novedades:', error);
      // Fallback a datos mock en caso de error crítico
      this.novedades$ = of([]);
    }
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
