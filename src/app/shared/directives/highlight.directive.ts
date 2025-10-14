import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

/**
 * ============================================================================
 * DIRECTIVA PERSONALIZADA - HIGHLIGHT
 * ============================================================================
 * 
 * Resalta elementos al pasar el mouse por encima con colores personalizables
 * 
 * Uso: <div appHighlight [highlightColor]="'yellow'">Contenido</div>
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {

  @Input() highlightColor: string = '#e3f2fd'; // Color por defecto (azul claro)
  @Input() highlightIntensity: number = 0.3; // Intensidad del resaltado (0-1)

  private originalBackground: string = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    // Guardar el color de fondo original
    this.originalBackground = this.el.nativeElement.style.backgroundColor || '';
  }

  /**
   * Evento cuando el mouse entra al elemento
   */
  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor);
  }

  /**
   * Evento cuando el mouse sale del elemento
   */
  @HostListener('mouseleave') onMouseLeave() {
    this.highlight(this.originalBackground);
  }

  /**
   * Evento cuando se hace clic en el elemento
   */
  @HostListener('click') onClick() {
    // Efecto de "flash" al hacer clic
    this.highlight('#ffeb3b'); // Amarillo
    setTimeout(() => {
      this.highlight(this.highlightColor);
    }, 150);
  }

  /**
   * Aplica el color de resaltado al elemento
   * @param color - Color a aplicar
   */
  private highlight(color: string) {
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', color);
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'background-color 0.3s ease');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'pointer');
  }
}
