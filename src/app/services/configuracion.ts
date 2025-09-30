import { Injectable, inject, signal } from '@angular/core';
import { Firestore, doc, setDoc, onSnapshot, DocumentData } from '@angular/fire/firestore';

/**
 * @interface ConfiguracionSitio
 * Define la estructura de los datos de configuración.
 * Esto nos ayuda a mantener la consistencia de los datos.
 */
export interface ConfiguracionSitio {
  titulo: string;
  subtitulo: string;
  // En el futuro, podríamos añadir más campos como:
  // logoUrl: string;
  // colorPrincipal: string;
}

/**
 * @class ConfiguracionService
 * Gestiona la configuración global del sitio almacenada en Firestore.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private firestore: Firestore = inject(Firestore);

  // --- SEÑAL DE ESTADO (SIGNAL) ---
  /**
   * @signal configuracionSignal
   * Almacena la configuración actual del sitio.
   * Se inicializa con un valor por defecto mientras se cargan los datos.
   */
  configuracionSignal = signal<ConfiguracionSitio>({
    titulo: 'Cargando...',
    subtitulo: '...',
  });

  constructor() {
    // --- LÓGICA DE ARRANQUE: CARGAR CONFIGURACIÓN ---
    // Nos conectamos a Firestore en cuanto el servicio es creado.
    this.escucharCambiosDeConfiguracion();
  }

  /**
   * Se suscribe a los cambios del documento de configuración en Firestore.
   * onSnapshot nos da actualizaciones en tiempo real.
   * @private
   */
  private escucharCambiosDeConfiguracion(): void {
    const docRef = doc(this.firestore, 'configuracion', 'sitio');

    onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          // Si el documento existe, actualizamos la señal con sus datos.
          this.configuracionSignal.set(snapshot.data() as ConfiguracionSitio);
        } else {
          // Si el documento no existe, lo creamos con valores por defecto.
          console.warn(
            'No se encontró configuración en Firestore. Creando documento por defecto...',
          );
          // Esta llamada a 'actualizarConfiguracion' creará el documento.
          this.actualizarConfiguracion({
            titulo: 'Proyecto Final',
            subtitulo:
              'Una aplicación de demostración que integra un sistema de autenticación y un carrito de compras funcional.',
          });
        }
      },
      (error) => {
        // Manejo de errores en caso de que falle la conexión.
        console.error('Error al escuchar la configuración del sitio:', error);
        this.configuracionSignal.set({
          titulo: 'Error al cargar',
          subtitulo: 'Intente de nuevo más tarde.',
        });
      },
    );
  }

  /**
   * Actualiza el documento de configuración en Firestore.
   * @param nuevosDatos - Un objeto parcial con los datos a actualizar.
   * @returns Una promesa que se resuelve cuando la operación de escritura finaliza.
   */
  actualizarConfiguracion(nuevosDatos: Partial<ConfiguracionSitio>): Promise<void> {
    const docRef = doc(this.firestore, 'configuracion', 'sitio');
    // Usamos setDoc con { merge: true } para actualizar solo los campos que enviamos,
    // sin sobrescribir el documento entero. Si el documento no existe, lo crea.
    return setDoc(docRef, nuevosDatos, { merge: true });
  }
}
