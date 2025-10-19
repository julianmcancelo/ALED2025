import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfiguracionService, ConfiguracionSitio } from '../../servicios/configuracion';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuracion-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="configuracion-container">
      <div class="header-section">
        <h2><i class="bi bi-gear-fill"></i> Configuración de la Tienda</h2>
        <p class="subtitle">Personaliza la información y apariencia de tu tienda online</p>
      </div>

      <form [formGroup]="configuracionForm" (ngSubmit)="guardarConfiguracion()" class="config-form">
        <div class="config-grid">
          <!-- Información Básica -->
          <div class="config-card">
            <div class="card-header">
              <h3><i class="bi bi-info-circle"></i> Información Básica</h3>
            </div>
            <div class="card-content">
              <div class="form-group">
                <label for="titulo">Título del Sitio</label>
                <input 
                  type="text" 
                  id="titulo" 
                  formControlName="titulo"
                  class="form-control"
                  placeholder="Ej: ALED2025">
              </div>

              <div class="form-group">
                <label for="subtitulo">Subtítulo</label>
                <input 
                  type="text" 
                  id="subtitulo" 
                  formControlName="subtitulo"
                  class="form-control"
                  placeholder="Ej: Tu tienda online de confianza">
              </div>

              <div class="form-group">
                <label for="nombreTienda">Nombre de la Tienda</label>
                <input 
                  type="text" 
                  id="nombreTienda" 
                  formControlName="nombreTienda"
                  class="form-control"
                  placeholder="Ej: ALED2025 Store">
                <small class="form-help">Este nombre aparecerá en las reseñas y estadísticas</small>
              </div>

              <div class="form-group">
                <label for="descripcionTienda">Descripción</label>
                <textarea 
                  id="descripcionTienda" 
                  formControlName="descripcionTienda"
                  class="form-control"
                  rows="3"
                  placeholder="Describe tu tienda..."></textarea>
              </div>
            </div>
          </div>

          <!-- Colores y Diseño -->
          <div class="config-card">
            <div class="card-header">
              <h3><i class="bi bi-palette"></i> Colores y Diseño</h3>
            </div>
            <div class="card-content">
              <div class="color-group">
                <div class="form-group">
                  <label for="colorPrincipal">Color Principal</label>
                  <div class="color-input-group">
                    <input 
                      type="color" 
                      id="colorPrincipal" 
                      formControlName="colorPrincipal"
                      class="color-picker">
                    <input 
                      type="text" 
                      formControlName="colorPrincipal"
                      class="form-control color-text"
                      placeholder="#0077b6">
                  </div>
                  <div class="color-preview" [style.background-color]="configuracionForm.get('colorPrincipal')?.value">
                    <span>Vista previa</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="colorSecundario">Color Secundario</label>
                  <div class="color-input-group">
                    <input 
                      type="color" 
                      id="colorSecundario" 
                      formControlName="colorSecundario"
                      class="color-picker">
                    <input 
                      type="text" 
                      formControlName="colorSecundario"
                      class="form-control color-text"
                      placeholder="#00a650">
                  </div>
                  <div class="color-preview" [style.background-color]="configuracionForm.get('colorSecundario')?.value">
                    <span>Vista previa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Información de Contacto -->
          <div class="config-card">
            <div class="card-header">
              <h3><i class="bi bi-telephone"></i> Información de Contacto</h3>
            </div>
            <div class="card-content">
              <div class="form-group">
                <label for="emailContacto">Email de Contacto</label>
                <input 
                  type="email" 
                  id="emailContacto" 
                  formControlName="emailContacto"
                  class="form-control"
                  placeholder="contacto@tutienda.com">
              </div>

              <div class="form-group">
                <label for="telefonoContacto">Teléfono</label>
                <input 
                  type="tel" 
                  id="telefonoContacto" 
                  formControlName="telefonoContacto"
                  class="form-control"
                  placeholder="+54 11 1234-5678">
              </div>

              <div class="form-group">
                <label for="direccion">Dirección</label>
                <input 
                  type="text" 
                  id="direccion" 
                  formControlName="direccion"
                  class="form-control"
                  placeholder="Buenos Aires, Argentina">
              </div>
            </div>
          </div>

          <!-- Redes Sociales -->
          <div class="config-card">
            <div class="card-header">
              <h3><i class="bi bi-share"></i> Redes Sociales</h3>
            </div>
            <div class="card-content">
              <div formGroupName="redesSociales">
                <div class="form-group">
                  <label for="facebook"><i class="bi bi-facebook"></i> Facebook</label>
                  <input 
                    type="url" 
                    id="facebook" 
                    formControlName="facebook"
                    class="form-control"
                    placeholder="https://facebook.com/tutienda">
                </div>

                <div class="form-group">
                  <label for="instagram"><i class="bi bi-instagram"></i> Instagram</label>
                  <input 
                    type="url" 
                    id="instagram" 
                    formControlName="instagram"
                    class="form-control"
                    placeholder="https://instagram.com/tutienda">
                </div>

                <div class="form-group">
                  <label for="whatsapp"><i class="bi bi-whatsapp"></i> WhatsApp</label>
                  <input 
                    type="tel" 
                    id="whatsapp" 
                    formControlName="whatsapp"
                    class="form-control"
                    placeholder="+5491123456789">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="actions-section">
          <button type="submit" class="btn-primary" [disabled]="configuracionForm.invalid || guardando">
            @if (guardando) {
              <i class="bi bi-arrow-clockwise spin"></i>
              Guardando...
            } @else {
              <i class="bi bi-check-circle"></i>
              Guardar Configuración
            }
          </button>
          
          <button type="button" class="btn-secondary" (click)="resetearFormulario()">
            <i class="bi bi-arrow-counterclockwise"></i>
            Restablecer
          </button>

          <button type="button" class="btn-info" (click)="previsualizarCambios()">
            <i class="bi bi-eye"></i>
            Vista Previa
          </button>
        </div>
      </form>

      <!-- Preview de la configuración -->
      @if (mostrarPreview) {
        <div class="preview-section">
          <h3><i class="bi bi-eye"></i> Vista Previa</h3>
          <div class="preview-card" 
               [style.border-left-color]="configuracionForm.get('colorPrincipal')?.value">
            <div class="preview-header" 
                 [style.background-color]="configuracionForm.get('colorPrincipal')?.value">
              <h4>{{ configuracionForm.get('titulo')?.value }}</h4>
              <p>{{ configuracionForm.get('subtitulo')?.value }}</p>
            </div>
            <div class="preview-content">
              <div class="preview-store-info">
                <div class="store-avatar" 
                     [style.background-color]="configuracionForm.get('colorSecundario')?.value">
                  <i class="bi bi-shop"></i>
                </div>
                <div class="store-details">
                  <h5>{{ configuracionForm.get('nombreTienda')?.value }}</h5>
                  <p>{{ configuracionForm.get('descripcionTienda')?.value }}</p>
                  <div class="contact-info">
                    <span><i class="bi bi-envelope"></i> {{ configuracionForm.get('emailContacto')?.value }}</span>
                    <span><i class="bi bi-telephone"></i> {{ configuracionForm.get('telefonoContacto')?.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./configuracion-tienda.component.css']
})
export class ConfiguracionTiendaComponent implements OnInit {
  private configuracionService = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  configuracionForm!: FormGroup;
  guardando = false;
  mostrarPreview = false;

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarConfiguracionActual();
  }

  private inicializarFormulario(): void {
    this.configuracionForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(2)]],
      subtitulo: ['', [Validators.required, Validators.minLength(5)]],
      nombreTienda: ['', [Validators.required, Validators.minLength(3)]],
      colorPrincipal: ['#0077b6', [Validators.required]],
      colorSecundario: ['#00a650', [Validators.required]],
      descripcionTienda: ['', [Validators.required, Validators.minLength(10)]],
      emailContacto: ['', [Validators.required, Validators.email]],
      telefonoContacto: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      redesSociales: this.fb.group({
        facebook: [''],
        instagram: [''],
        twitter: [''],
        whatsapp: ['']
      })
    });
  }

  private cargarConfiguracionActual(): void {
    this.configuracionService.obtenerConfiguracion().subscribe({
      next: (config) => {
        this.configuracionForm.patchValue(config);
      },
      error: (error) => {
        console.error('Error cargando configuración:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar la configuración actual',
          icon: 'error'
        });
      }
    });
  }

  async guardarConfiguracion(): Promise<void> {
    if (this.configuracionForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.guardando = true;

    try {
      const configuracion = this.configuracionForm.value as ConfiguracionSitio;
      
      // Guardar configuración
      await this.configuracionService.actualizarConfiguracion(configuracion);
      
      // Sincronizar nombre del vendedor si cambió
      const nombreAnterior = this.configuracionService.configuracionSignal().nombreTienda;
      if (nombreAnterior !== configuracion.nombreTienda) {
        console.log('🔄 Sincronizando nombre del vendedor...');
        // El servicio de reseñas se encargará de la sincronización automáticamente
      }

      Swal.fire({
        title: '¡Configuración Guardada!',
        text: 'Los cambios se han aplicado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error guardando configuración:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar la configuración',
        icon: 'error'
      });
    } finally {
      this.guardando = false;
    }
  }

  resetearFormulario(): void {
    Swal.fire({
      title: '¿Restablecer configuración?',
      text: 'Se perderán todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cargarConfiguracionActual();
        this.mostrarPreview = false;
      }
    });
  }

  previsualizarCambios(): void {
    this.mostrarPreview = !this.mostrarPreview;
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.configuracionForm.controls).forEach(key => {
      const control = this.configuracionForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }
}
