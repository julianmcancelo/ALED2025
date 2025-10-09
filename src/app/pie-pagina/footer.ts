import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionService } from '../servicios/configuracion';

// Declarar Bootstrap para evitar errores de TypeScript
declare var bootstrap: any;

/**
 * Componente encargado de mostrar el pie de página moderno de la aplicación.
 * Incluye secciones organizadas como SHEIN: enlaces útiles, newsletter, 
 * redes sociales, métodos de pago e información del proyecto.
 * Todos los enlaces abren modals con información detallada.
 * Es un componente 'standalone', gestionando sus propias dependencias.
 */
@Component({
  selector: 'app-footer', // Selector para usar este componente: <app-footer></app-footer>
  imports: [
    CommonModule, // Importa directivas comunes de Angular
  ],
  templateUrl: './footer.html', // Plantilla HTML del componente.
  styleUrl: './footer.css', // Hoja de estilos del componente.
})
export class Footer {
  /**
   * Servicio de configuración para obtener el título dinámico
   */
  configuracionService = inject(ConfiguracionService);

  /**
   * Genera el texto del copyright dinámicamente usando el título del servicio de configuración
   */
  get copyrightText(): string {
    const titulo = this.configuracionService.configuracionSignal().titulo;
    const year = new Date().getFullYear();
    return `©${year} ${titulo}. Todos los derechos reservados.`;
  }

  /**
   * Método para abrir modals según el tipo de contenido
   * @param modalType - Tipo de modal a abrir
   */
  openModal(modalType: string): void {
    // Prevenir el comportamiento por defecto del enlace
    event?.preventDefault();
    
    // Mapear tipos de modal a IDs de elementos
    const modalId = `${modalType}-modal`;
    
    // Buscar el elemento modal
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      // Crear instancia de modal de Bootstrap y mostrarlo
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error(`Modal con ID '${modalId}' no encontrado`);
    }
  }

  /**
   * Método para manejar la suscripción al newsletter
   */
  onNewsletterSubmit(event: Event): void {
    event.preventDefault();
    // Aquí se puede implementar la lógica de suscripción
    console.log('Newsletter subscription requested');
    
    // Mostrar mensaje de confirmación (temporal)
    alert('Suscripción registrada exitosamente. Recibirá notificaciones sobre ofertas y novedades.');
  }

  /**
   * Método para manejar el envío del formulario de contacto
   */
  onContactSubmit(event: Event): void {
    event.preventDefault();
    // Aquí se puede implementar la lógica de envío de contacto
    console.log('Contact form submitted');
    
    // Mostrar mensaje de confirmación (temporal)
    alert('Consulta enviada correctamente. Recibirá respuesta en un plazo de 24-48 horas hábiles.');
  }
}
