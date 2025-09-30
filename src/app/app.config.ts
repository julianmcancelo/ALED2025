import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { UserService } from './services/user';

// Importamos los componentes y el nuevo guardia
import { Home } from './home/home';
import { Admin } from './admin/admin';
import { adminGuard } from './auth/admin-guard';
import { PrimerUsuario } from './auth/primer-usuario/primer-usuario';

// Importaciones de Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth'; // <-- AÑADIDO

const firebaseConfig = {
  apiKey: 'AIzaSyAJncpI42BQRSh_c4hjsxZv5q_esZFG4pk',
  authDomain: 'aled3-6b4ee.firebaseapp.com',
  projectId: 'aled3-6b4ee',
  storageBucket: 'aled3-6b4ee.appspot.com',
  messagingSenderId: '136139298833',
  appId: '1:136139298833:web:b89757a4e9c69a75a139b0',
  measurementId: 'G-9KW8V43530',
};

// Función Factory para el APP_INITIALIZER
const initializeAppFactory = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return async () => {
    try {
      const usersExist = await userService.checkIfUsersExist();
      if (!usersExist) {
        // Si no hay usuarios, redirigimos a la página de creación del primer usuario
        await router.navigate(['/primer-usuario']);
      }
    } catch (error) {
      console.error('Error durante la inicialización de la app:', error);
      // Opcional: redirigir a una página de error
    }
  };
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Proveedor para ejecutar lógica ANTES de que la app se inicie
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      multi: true,
    },

    // Proveemos las rutas a la aplicación
    provideRouter([
      { path: '', component: Home, pathMatch: 'full' },
      { path: 'primer-usuario', component: PrimerUsuario },
      {
        path: 'administracion',
        component: Admin,
        canActivate: [adminGuard], // ¡Aquí aplicamos el guardia!
      },
    ]),

    // Proveedores de Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()), // <-- AÑADIDO
  ],
};
