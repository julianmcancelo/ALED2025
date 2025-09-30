import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// Importaciones necesarias para inicializar Firebase en un proyecto de Angular.
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

// Objeto de configuración de Firebase, obtenido desde la consola de Firebase.
// Contiene las claves y endpoints necesarios para que la aplicación se conecte al proyecto correcto.
const firebaseConfig = {
  apiKey: 'AIzaSyAJncpI42BQRSh_c4hjsxZv5q_esZFG4pk',
  authDomain: 'aled3-6b4ee.firebaseapp.com',
  projectId: 'aled3-6b4ee',
  storageBucket: 'aled3-6b4ee.appspot.com',
  messagingSenderId: '136139298833',
  appId: '1:136139298833:web:b89757a4e9c69a75a139b0',
  measurementId: 'G-9KW8V43530',
};

/**
 * Configuración a nivel de aplicación.
 * Aquí se registran los "proveedores" de servicios que estarán disponibles para toda la aplicación.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración estándar de Angular para la detección de cambios.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Inicializa la conexión con Firebase usando la configuración proporcionada.
    provideFirebaseApp(() => initializeApp(firebaseConfig)),

    // Habilita y provee el servicio de Firestore (la base de datos).
    provideFirestore(() => getFirestore()),
  ],
};
