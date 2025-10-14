import { Directive, ElementRef, Input, Renderer2, OnChanges } from '@angular/core';

/**
 * ============================================================================
 * DIRECTIVA PERSONALIZADA - LOADING BUTTON
 * ============================================================================
 * 
 * Convierte cualquier botón en un botón con estado de carga
 * Muestra spinner y desactiva el botón durante operaciones async
 * 
 * Uso: <button appLoadingButton [isLoading]="cargando">Guardar</button>
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

@Directive({
  selector: '[appLoadingButton]',
  standalone: true
})
export class LoadingButtonDirective implements OnChanges {

  @Input() isLoading: boolean = false;
  @Input() loadingText: string = 'Cargando...';
  @Input() spinnerColor: string = '#ffffff';

  private originalText: string = '';
  private originalDisabled: boolean = false;
  private spinnerElement: HTMLElement | null = null;

  constructor(
    private el: ElementRef<HTMLButtonElement>,
    private renderer: Renderer2
  ) {
    // Guardar el texto original del botón
    this.originalText = this.el.nativeElement.textContent || '';
    this.originalDisabled = this.el.nativeElement.disabled;
  }

  ngOnChanges() {
    if (this.isLoading) {
      this.showLoading();
    } else {
      this.hideLoading();
    }
  }

  /**
   * Muestra el estado de carga
   */
  private showLoading() {
    // Desactivar el botón
    this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
    
    // Crear spinner
    this.createSpinner();
    
    // Cambiar el texto
    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', '');
    
    if (this.spinnerElement) {
      this.renderer.appendChild(this.el.nativeElement, this.spinnerElement);
    }
    
    // Agregar texto de carga si se especifica
    if (this.loadingText) {
      const textNode = this.renderer.createText(` ${this.loadingText}`);
      this.renderer.appendChild(this.el.nativeElement, textNode);
    }
    
    // Agregar clase CSS para estilos adicionales
    this.renderer.addClass(this.el.nativeElement, 'loading-button');
  }

  /**
   * Oculta el estado de carga
   */
  private hideLoading() {
    // Restaurar el botón
    this.renderer.setProperty(this.el.nativeElement, 'disabled', this.originalDisabled);
    this.renderer.setProperty(this.el.nativeElement, 'textContent', this.originalText);
    
    // Remover spinner
    if (this.spinnerElement) {
      this.renderer.removeChild(this.el.nativeElement, this.spinnerElement);
      this.spinnerElement = null;
    }
    
    // Remover clase CSS
    this.renderer.removeClass(this.el.nativeElement, 'loading-button');
  }

  /**
   * Crea el elemento spinner
   */
  private createSpinner() {
    this.spinnerElement = this.renderer.createElement('span');
    this.renderer.addClass(this.spinnerElement, 'spinner-border');
    this.renderer.addClass(this.spinnerElement, 'spinner-border-sm');
    this.renderer.setStyle(this.spinnerElement, 'width', '1rem');
    this.renderer.setStyle(this.spinnerElement, 'height', '1rem');
    this.renderer.setStyle(this.spinnerElement, 'color', this.spinnerColor);
    this.renderer.setAttribute(this.spinnerElement, 'role', 'status');
    this.renderer.setAttribute(this.spinnerElement, 'aria-hidden', 'true');
  }
}
