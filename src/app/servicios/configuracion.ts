import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, setDoc, onSnapshot, DocumentData, getDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * @interface ConfiguracionSitio
 * Define la estructura de los datos de configuración.
 */
export interface ConfiguracionSitio {
  titulo: string;
  subtitulo: string;
  nombreTienda: string;
  colorPrincipal: string;
  colorSecundario: string;
  logoUrl?: string;
  descripcionTienda: string;
  emailContacto: string;
  telefonoContacto: string;
  direccion: string;
  redesSociales: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

/**
 * @class ConfiguracionService
 * Gestiona la configuración global del sitio almacenada en Firestore.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  private firestore: Firestore = inject(Firestore);

  // Señal de estado con configuración por defecto
  configuracionSignal = signal<ConfiguracionSitio>({
    titulo: 'ALED2025',
    subtitulo: 'Tu tienda online de confianza',
    nombreTienda: 'ALED2025 Store',
    colorPrincipal: '#0077b6',
    colorSecundario: '#00a650',
    descripcionTienda: 'Tienda online especializada en productos de calidad con envío a todo el país',
    emailContacto: 'contacto@aled2025.com',
    telefonoContacto: '+54 11 1234-5678',
    direccion: 'Buenos Aires, Argentina',
    redesSociales: {
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: '+5491123456789'
    }
  });

  constructor() {
    this.inicializarConfiguracion();
  }

  /**
   * Inicializa la configuración desde Firestore
   */
  private async inicializarConfiguracion(): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'configuracion', 'sitio');
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as ConfiguracionSitio;
        this.configuracionSignal.set(data);
        console.log('✅ Configuración cargada desde Firestore');
      } else {
        // Crear configuración inicial
        const configInicial = this.configuracionSignal();
        await this.actualizarConfiguracion(configInicial);
        console.log('✅ Configuración inicial creada en Firestore');
      }
      
      // Escuchar cambios en tiempo real
      this.escucharCambios();
    } catch (error) {
      console.error('❌ Error inicializando configuración:', error);
    }
  }

  /**
   * Escucha cambios en tiempo real
   */
  private escucharCambios(): void {
    const docRef = doc(this.firestore, 'configuracion', 'sitio');
    
    onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ConfiguracionSitio;
        this.configuracionSignal.set(data);
      }
    }, (error) => {
      console.error('Error escuchando cambios de configuración:', error);
    });
  }

  /**
   * Actualiza la configuración en Firestore
   */
  async actualizarConfiguracion(nuevosDatos: Partial<ConfiguracionSitio>): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'configuracion', 'sitio');
      await setDoc(docRef, nuevosDatos, { merge: true });
      console.log('✅ Configuración actualizada en Firestore');
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      throw error;
    }
  }

  /**
   * Obtiene la configuración actual como Observable
   */
  obtenerConfiguracion(): Observable<ConfiguracionSitio> {
    const docRef = doc(this.firestore, 'configuracion', 'sitio');
    
    return from(getDoc(docRef)).pipe(
      map(docSnapshot => {
        if (docSnapshot.exists()) {
          return docSnapshot.data() as ConfiguracionSitio;
        } else {
          return this.configuracionSignal();
        }
      }),
      catchError(error => {
        console.error('Error obteniendo configuración:', error);
        return [this.configuracionSignal()];
      })
    );
  }

  /**
   * Actualiza solo el nombre de la tienda
   */
  async actualizarNombreTienda(nombre: string): Promise<void> {
    await this.actualizarConfiguracion({ nombreTienda: nombre });
  }

  /**
   * Actualiza los colores del tema
   */
  async actualizarColores(principal: string, secundario: string): Promise<void> {
    await this.actualizarConfiguracion({ 
      colorPrincipal: principal, 
      colorSecundario: secundario 
    });
  }
}
