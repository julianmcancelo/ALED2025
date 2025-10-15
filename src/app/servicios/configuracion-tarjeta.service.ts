/**
 * SERVICIO DE CONFIGURACIÓN DE TARJETAS VIRTUALES - VERSIÓN LIMPIA
 * 
 * Este servicio maneja la configuración personalizada de las tarjetas virtuales,
 * permitiendo a los administradores modificar el logo, tipo de tarjeta, nombre del banco
 * y otros aspectos visuales de las tarjetas.
 */

import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { ConfiguracionTarjetaPersonalizada, CONFIGURACION_TARJETA_DEFAULT } from '../shared/models/tarjeta-virtual.model';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionTarjetaService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  // Configuración de la colección
  private readonly COLECCION_CONFIGURACION = 'configuracion-tarjetas';
  private readonly ID_CONFIGURACION = 'configuracion-principal';

  // Subject para manejar la configuración actual
  private configuracionSubject = new BehaviorSubject<ConfiguracionTarjetaPersonalizada | null>(null);

  constructor() {
    this.cargarConfiguracion();
  }

  /**
   * Observable de la configuración actual
   */
  get configuracion$(): Observable<ConfiguracionTarjetaPersonalizada | null> {
    return this.configuracionSubject.asObservable();
  }

  /**
   * Obtiene la configuración actual de forma síncrona
   */
  configuracionActual = () => this.configuracionSubject.value;

  /**
   * Carga la configuración desde Firestore
   */
  async cargarConfiguracion(): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log('📥 Cargando configuración de tarjetas...');

        const configRef = doc(this.firestore, this.COLECCION_CONFIGURACION, this.ID_CONFIGURACION);
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
          const config = configSnap.data() as ConfiguracionTarjetaPersonalizada;
          this.configuracionSubject.next(config);
          console.log('✅ Configuración cargada:', config);
        } else {
          // Crear configuración por defecto si no existe
          await this.crearConfiguracionPorDefecto();
        }

      } catch (error) {
        console.error('❌ Error al cargar configuración:', error);
        // Usar configuración por defecto en caso de error
        this.usarConfiguracionPorDefecto();
      }
    });
  }

  /**
   * Crea la configuración por defecto en Firestore
   */
  private async crearConfiguracionPorDefecto(): Promise<void> {
    console.log('🔧 Creando configuración por defecto...');

    const configPorDefecto: ConfiguracionTarjetaPersonalizada = {
      tipoTarjetaDefault: CONFIGURACION_TARJETA_DEFAULT.TIPO_TARJETA_DEFAULT,
      nombreBanco: CONFIGURACION_TARJETA_DEFAULT.NOMBRE_BANCO_DEFAULT,
      logoBase64: '',
      prefijoNumero: '4532',
      colorPrimario: CONFIGURACION_TARJETA_DEFAULT.COLOR_PRIMARIO_DEFAULT,
      colorSecundario: CONFIGURACION_TARJETA_DEFAULT.COLOR_SECUNDARIO_DEFAULT,
      fechaActualizacion: new Date(),
      adminId: 'sistema'
    };

    const configRef = doc(this.firestore, this.COLECCION_CONFIGURACION, this.ID_CONFIGURACION);
    await setDoc(configRef, configPorDefecto);

    this.configuracionSubject.next(configPorDefecto);
    console.log('✅ Configuración por defecto creada');
  }

  /**
   * Usa la configuración por defecto sin guardar en Firestore
   */
  private usarConfiguracionPorDefecto(): void {
    const configPorDefecto: ConfiguracionTarjetaPersonalizada = {
      tipoTarjetaDefault: CONFIGURACION_TARJETA_DEFAULT.TIPO_TARJETA_DEFAULT,
      nombreBanco: CONFIGURACION_TARJETA_DEFAULT.NOMBRE_BANCO_DEFAULT,
      logoBase64: '',
      prefijoNumero: '4532',
      colorPrimario: CONFIGURACION_TARJETA_DEFAULT.COLOR_PRIMARIO_DEFAULT,
      colorSecundario: CONFIGURACION_TARJETA_DEFAULT.COLOR_SECUNDARIO_DEFAULT,
      fechaActualizacion: new Date(),
      adminId: 'sistema'
    };

    this.configuracionSubject.next(configPorDefecto);
  }

  /**
   * Actualiza la configuración de tarjetas virtuales
   */
  async actualizarConfiguracion(
    nuevaConfiguracion: Partial<ConfiguracionTarjetaPersonalizada>,
    adminId: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log('🔧 Actualizando configuración de tarjetas:', nuevaConfiguracion);

        const configRef = doc(this.firestore, this.COLECCION_CONFIGURACION, this.ID_CONFIGURACION);
        
        const datosActualizacion = {
          ...nuevaConfiguracion,
          fechaActualizacion: serverTimestamp(),
          adminId
        };

        await updateDoc(configRef, datosActualizacion);

        // Recargar configuración
        await this.cargarConfiguracion();

        console.log('✅ Configuración actualizada exitosamente');

      } catch (error) {
        console.error('❌ Error al actualizar configuración:', error);
        throw new Error(`No se pudo actualizar la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    });
  }

  /**
   * Valida que una imagen en base64 sea válida
   */
  validarImagenBase64(base64: string): boolean {
    try {
      if (!base64 || typeof base64 !== 'string') {
        return false;
      }

      const base64Pattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
      if (!base64Pattern.test(base64)) {
        return false;
      }

      const sizeInBytes = (base64.length * 3) / 4;
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      
      return sizeInBytes <= maxSizeInBytes;

    } catch (error) {
      console.error('Error validando imagen base64:', error);
      return false;
    }
  }

  /**
   * Convierte un archivo a base64
   */
  convertirArchivoABase64(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!archivo) {
        reject(new Error('No se proporcionó archivo'));
        return;
      }

      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!tiposPermitidos.includes(archivo.type)) {
        reject(new Error('Tipo de archivo no permitido. Use JPEG, PNG, GIF o WebP'));
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (archivo.size > maxSize) {
        reject(new Error('El archivo es demasiado grande. Máximo 2MB'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(archivo);
    });
  }

  /**
   * Obtiene los tipos de tarjeta disponibles
   */
  obtenerTiposTarjetaDisponibles(): string[] {
    return [
      'Visa',
      'Mastercard',
      'American Express',
      'Diners Club',
      'Discover',
      'JCB',
      'UnionPay',
      'Maestro'
    ];
  }

  /**
   * Obtiene prefijos de números según el tipo de tarjeta
   */
  obtenerPrefijoPorTipo(tipoTarjeta: string): string {
    const prefijos: { [key: string]: string } = {
      'Visa': '4',
      'Mastercard': '5',
      'American Express': '34',
      'Diners Club': '30',
      'Discover': '6',
      'JCB': '35',
      'UnionPay': '62',
      'Maestro': '50'
    };

    return prefijos[tipoTarjeta] || '4';
  }

  /**
   * Genera un número de tarjeta con el prefijo configurado
   */
  generarNumeroTarjeta(): string {
    const config = this.configuracionActual();
    const prefijo = config?.prefijoNumero || '4532';
    
    const digitosRestantes = 16 - prefijo.length;
    let numero = prefijo;
    
    for (let i = 0; i < digitosRestantes - 1; i++) {
      numero += Math.floor(Math.random() * 10).toString();
    }
    
    const digitoVerificador = this.calcularDigitoLuhn(numero);
    numero += digitoVerificador;
    
    return numero;
  }

  /**
   * Calcula el dígito verificador usando el algoritmo de Luhn
   */
  private calcularDigitoLuhn(numero: string): string {
    let suma = 0;
    let alternar = true;

    for (let i = numero.length - 1; i >= 0; i--) {
      let digito = parseInt(numero.charAt(i), 10);

      if (alternar) {
        digito *= 2;
        if (digito > 9) {
          digito = (digito % 10) + 1;
        }
      }

      suma += digito;
      alternar = !alternar;
    }

    return ((10 - (suma % 10)) % 10).toString();
  }
}
