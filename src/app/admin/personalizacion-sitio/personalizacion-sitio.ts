import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para usar ngModel
import { ConfiguracionService } from '../../servicios/configuracion';

/**
 * @component PersonalizacionSitio
 * Permite a los administradores modificar la configuración del sitio.
 */
@Component({
  selector: 'app-personalizacion-sitio',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importamos FormsModule
  templateUrl: './personalizacion-sitio.html',
  styleUrl: './personalizacion-sitio.css',
})
export class PersonalizacionSitio {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private configuracionService = inject(ConfiguracionService);

  // --- SEÑALES DE ESTADO LOCAL ---
  /**
   * @signal tituloActual
   * Almacena el valor del campo de texto del título.
   */
  protected tituloActual = signal<string>('');

  /**
   * @signal subtituloActual
   * Almacena el valor del campo de texto del subtítulo.
   */
  protected subtituloActual = signal<string>('');

  /**
   * @signal estadoGuardado
   * Controla el mensaje de feedback para el usuario.
   */
  protected estadoGuardado = signal<'inicial' | 'guardando' | 'guardado' | 'error'>('inicial');

  constructor() {
    // --- EFECTO (EFFECT) ---
    // Sincroniza las señales locales con los datos del servicio de configuración.
    effect(() => {
      const config = this.configuracionService.configuracionSignal();
      this.tituloActual.set(config.titulo);
      this.subtituloActual.set(config.subtitulo);
    });
  }

  /**
   * Se ejecuta cuando el usuario hace clic en el botón "Guardar Cambios".
   */
  async guardarCambios(): Promise<void> {
    this.estadoGuardado.set('guardando');
    try {
      // Llamamos al servicio para actualizar los datos en Firestore.
      await this.configuracionService.actualizarConfiguracion({
        titulo: this.tituloActual(),
        subtitulo: this.subtituloActual(),
      });
      this.estadoGuardado.set('guardado');

      // Hacemos que el mensaje de "Guardado" desaparezca después de 3 segundos.
      setTimeout(() => this.estadoGuardado.set('inicial'), 3000);
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      this.estadoGuardado.set('error'); // Si falla, estado 'error'
    }
  }
}
