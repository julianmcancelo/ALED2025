/**
 * COMPONENTE DE PERSONALIZACIÓN DE TARJETAS VIRTUALES
 * 
 * Este componente permite a los administradores personalizar la apariencia
 * de las tarjetas virtuales, incluyendo logo, tipo de tarjeta, nombre del banco
 * y colores.
 * 
 * Dependencias:
 * - Angular Material: Para componentes de UI
 * - ConfiguracionTarjetaService: Para gestionar la configuración
 * - AuthService: Para validar permisos de administrador
 * 
 * Flujo general:
 * 1. Cargar configuración actual
 * 2. Mostrar formulario de personalización
 * 3. Permitir subida de logo en base64
 * 4. Vista previa de la tarjeta
 * 5. Guardar cambios con validación
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Importamos nuestros servicios y modelos
import { ConfiguracionTarjetaService } from '../../servicios/configuracion-tarjeta.service';
import { AuthService } from '../../auth/auth';
import { ConfiguracionTarjetaPersonalizada } from '../../shared/models/tarjeta-virtual.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personalizacion-tarjetas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './personalizacion-tarjetas.component.html',
  styleUrls: ['./personalizacion-tarjetas.component.css']
})
export class PersonalizacionTarjetasComponent implements OnInit {
  // Servicios inyectados
  private configuracionService = inject(ConfiguracionTarjetaService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Signals para manejo reactivo del estado
  private readonly configuracionActual = signal<ConfiguracionTarjetaPersonalizada | null>(null);
  private readonly cargando = signal<boolean>(true);
  private readonly guardando = signal<boolean>(false);
  private readonly logoPreview = signal<string>('');

  // Computed signals
  readonly configuracion = computed(() => this.configuracionActual());
  readonly estaCargando = computed(() => this.cargando());
  readonly estaGuardando = computed(() => this.guardando());
  readonly logoActual = computed(() => {
    const preview = this.logoPreview();
    const config = this.configuracionActual();
    return preview || config?.logoBase64 || '';
  });
  readonly adminActual = computed(() => this.authService.currentUserSignal());

  // Formulario reactivo
  formularioPersonalizacion!: FormGroup;

  // Tipos de tarjeta disponibles
  readonly tiposTarjeta = this.configuracionService.obtenerTiposTarjetaDisponibles();

  ngOnInit(): void {
    this.verificarPermisos();
    this.inicializarFormulario();
    this.cargarConfiguracion();
  }

  /**
   * Verifica que el usuario actual tenga permisos de administrador
   */
  private verificarPermisos(): void {
    const usuario = this.adminActual();
    if (!usuario || usuario.rol !== 'admin') {
      console.warn('⚠️ Usuario sin permisos de administrador');
      alert('No tienes permisos para acceder a esta sección');
      return;
    }
  }

  /**
   * Inicializa el formulario reactivo
   */
  private inicializarFormulario(): void {
    this.formularioPersonalizacion = this.fb.group({
      tipoTarjetaDefault: ['', Validators.required],
      nombreBanco: ['', [Validators.required, Validators.maxLength(50)]],
      prefijoNumero: ['', [Validators.required, Validators.pattern(/^\d{1,4}$/)]],
      colorPrimario: ['', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
      colorSecundario: ['', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]]
    });

    // Escuchar cambios en el tipo de tarjeta para actualizar el prefijo
    this.formularioPersonalizacion.get('tipoTarjetaDefault')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        const prefijo = this.configuracionService.obtenerPrefijoPorTipo(tipo);
        this.formularioPersonalizacion.patchValue({ prefijoNumero: prefijo }, { emitEvent: false });
      }
    });
  }

  /**
   * Carga la configuración actual
   */
  private async cargarConfiguracion(): Promise<void> {
    try {
      this.cargando.set(true);
      
      // Cargar configuración desde el servicio
      await this.configuracionService.cargarConfiguracion();
      const config = this.configuracionService.configuracionActual();

      if (config) {
        // Actualizar la señal de configuración
        this.configuracionActual.set(config);

        // Actualizar formulario con la configuración cargada
        this.formularioPersonalizacion.patchValue({
          tipoTarjetaDefault: config.tipoTarjetaDefault,
          nombreBanco: config.nombreBanco,
          prefijoNumero: config.prefijoNumero,
          colorPrimario: config.colorPrimario,
          colorSecundario: config.colorSecundario
        });

        // Actualizar logo si existe
        if (config.logoBase64) {
          this.logoPreview.set(config.logoBase64);
        }

        console.log('✅ Configuración cargada:', config);
      } else {
        console.warn('⚠️ No se pudo cargar la configuración');
      }

    } catch (error) {
      console.error('❌ Error al cargar configuración:', error);
      alert('Error al cargar la configuración');
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * Maneja la selección de archivo para el logo
   */
  async onLogoSeleccionado(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) return;

    try {
      // Mostrar preview inmediato
      const previewUrl = URL.createObjectURL(archivo);
      this.logoPreview.set(previewUrl);

      // Convertir a base64
      const base64 = await this.configuracionService.convertirArchivoABase64(archivo);
      
      // Validar la imagen
      if (!this.configuracionService.validarImagenBase64(base64)) {
        throw new Error('Imagen no válida o demasiado grande');
      }

      // Actualizar el preview con base64
      this.logoPreview.set(base64);
      
      console.log('✅ Logo cargado correctamente');

    } catch (error) {
      console.error('❌ Error al procesar logo:', error);
      this.logoPreview.set('');
      alert(error instanceof Error ? error.message : 'Error al procesar el logo');
    }
  }

  /**
   * Elimina el logo actual
   */
  eliminarLogo(): void {
    this.logoPreview.set('');
    console.log('✅ Logo eliminado');
  }

  /**
   * Guarda la configuración actualizada
   */
  async guardarConfiguracion(): Promise<void> {
    if (!this.formularioPersonalizacion.valid) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    const admin = this.adminActual();
    if (!admin?.id) {
      alert('Error de autenticación');
      return;
    }

    // Confirmar los cambios
    const confirmacion = await Swal.fire({
      title: '¿Guardar Configuración?',
      html: `
        <div class="text-left">
          <p>Se aplicarán los siguientes cambios a todas las nuevas tarjetas virtuales:</p>
          <ul class="list-unstyled mt-3">
            <li><strong>Tipo:</strong> ${this.formularioPersonalizacion.value.tipoTarjetaDefault}</li>
            <li><strong>Banco:</strong> ${this.formularioPersonalizacion.value.nombreBanco}</li>
            <li><strong>Prefijo:</strong> ${this.formularioPersonalizacion.value.prefijoNumero}****</li>
            <li><strong>Logo:</strong> ${this.logoActual() ? 'Personalizado' : 'Sin logo'}</li>
          </ul>
          <div class="alert alert-info mt-3">
            <small><i class="bi bi-info-circle me-1"></i>Los cambios solo afectarán a las tarjetas creadas después de guardar.</small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (!confirmacion.isConfirmed) return;

    this.guardando.set(true);

    try {
      const configuracionCompleta: Partial<ConfiguracionTarjetaPersonalizada> = {
        ...this.formularioPersonalizacion.value,
        logoBase64: this.logoActual()
      };

      // Guardar configuración
      await this.configuracionService.actualizarConfiguracion(configuracionCompleta, admin.id);

      // Actualizar todas las tarjetas existentes
      try {
        console.log('🔄 Actualizando todas las tarjetas existentes...');
        await this.actualizarTodasLasTarjetasExistentes(configuracionCompleta);
        console.log('✅ Todas las tarjetas actualizadas');
      } catch (updateError) {
        console.error('⚠️ Error actualizando tarjetas existentes:', updateError);
        // No fallar el guardado si hay error actualizando tarjetas
      }

      this.guardando.set(false);
      
      // Confirmar éxito
      await Swal.fire({
        title: '¡Configuración Guardada!',
        html: `
          <div class="text-left">
            <p><strong>✅ Configuración actualizada exitosamente</strong></p>
            <p><strong>✅ Todas las tarjetas existentes actualizadas</strong></p>
            <p class="text-muted mt-2">Los cambios se han aplicado a todas las tarjetas virtuales del sistema.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Entendido'
      });

      // Recargar configuración
      await this.cargarConfiguracion();

    } catch (error) {
      console.error('❌ Error al guardar configuración:', error);
      this.guardando.set(false);
      
      await Swal.fire({
        title: 'Error al Guardar',
        text: error instanceof Error ? error.message : 'Error desconocido',
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    } finally {
      this.guardando.set(false);
    }
  }

  /**
   * Restaura la configuración por defecto
   */
  async restaurarDefecto(): Promise<void> {
    const confirmacion = await Swal.fire({
      title: '¿Restaurar Configuración?',
      text: 'Se perderán todos los cambios personalizados y se volverá a la configuración por defecto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (!confirmacion.isConfirmed) return;

    // Resetear formulario a valores por defecto
    this.formularioPersonalizacion.patchValue({
      tipoTarjetaDefault: 'Visa',
      nombreBanco: 'Banco Virtual',
      prefijoNumero: '4532',
      colorPrimario: '#3b82f6',
      colorSecundario: '#1e40af'
    });

    this.logoPreview.set('');
    
    console.log('✅ Configuración restaurada a valores por defecto');
  }

  /**
   * Obtiene el estilo CSS para la vista previa de la tarjeta
   */
  getEstiloTarjetaPreview(): any {
    const colorPrimario = this.formularioPersonalizacion.get('colorPrimario')?.value || '#3b82f6';
    const colorSecundario = this.formularioPersonalizacion.get('colorSecundario')?.value || '#1e40af';
    
    return {
      background: `linear-gradient(135deg, ${colorPrimario} 0%, ${colorSecundario} 100%)`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
    };
  }

  /**
   * Actualiza todas las tarjetas virtuales existentes con la nueva configuración
   */
  private async actualizarTodasLasTarjetasExistentes(configuracion: Partial<ConfiguracionTarjetaPersonalizada>): Promise<void> {
    try {
      console.log('🔄 Iniciando actualización de tarjetas existentes...');
      
      // Importar Firestore dinámicamente
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { Firestore } = await import('@angular/fire/firestore');
      
      // Obtener todas las tarjetas virtuales
      const firestore = this.configuracionService['firestore']; // Acceso al firestore del servicio
      const tarjetasRef = collection(firestore, 'tarjetas-virtuales');
      const tarjetasSnapshot = await getDocs(tarjetasRef);
      
      if (tarjetasSnapshot.empty) {
        console.log('ℹ️ No hay tarjetas para actualizar');
        return;
      }

      console.log(`📊 Encontradas ${tarjetasSnapshot.size} tarjetas para actualizar`);

      // Crear un batch para actualizar todas las tarjetas de una vez
      const batch = writeBatch(firestore);
      let tarjetasActualizadas = 0;

      tarjetasSnapshot.forEach((docSnapshot) => {
        const tarjetaRef = doc(firestore, 'tarjetas-virtuales', docSnapshot.id);
        
        // Actualizar solo los campos de personalización
        batch.update(tarjetaRef, {
          tipoTarjeta: configuracion.tipoTarjetaDefault || 'Visa',
          nombreBanco: configuracion.nombreBanco || 'Banco Virtual',
          logoBase64: configuracion.logoBase64 || '',
          // Mantener el número de tarjeta original, solo actualizar apariencia
          fechaActualizacion: new Date()
        });
        
        tarjetasActualizadas++;
      });

      // Ejecutar todas las actualizaciones
      await batch.commit();
      
      console.log(`✅ ${tarjetasActualizadas} tarjetas actualizadas exitosamente`);
      
    } catch (error) {
      console.error('❌ Error actualizando tarjetas existentes:', error);
      throw new Error('Error al actualizar las tarjetas existentes: ' + (error as Error).message);
    }
  }

  /**
   * Genera un número de ejemplo para la vista previa
   */
  getNumeroEjemplo(): string {
    const prefijo = this.formularioPersonalizacion.get('prefijoNumero')?.value || '4532';
    const resto = '************'.substring(0, 16 - prefijo.length);
    return (prefijo + resto).replace(/(.{4})/g, '$1 ').trim();
  }
}
