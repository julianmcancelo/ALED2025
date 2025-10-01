import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { UserService } from './services/user';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Importamos los componentes y el nuevo guardia
import { Home } from './home/home';
import { Admin } from './admin/admin';
import { adminGuard } from './auth/admin-guard';
import { PrimerUsuario } from './auth/primer-usuario/primer-usuario';
import { BienvenidaAdmin } from './admin/bienvenida/bienvenida';
import { GestionUsuarios } from './admin/gestion-usuarios/gestion-usuarios';
import { PersonalizacionSitio } from './admin/personalizacion-sitio/personalizacion-sitio';
import { PerfilUsuarioComponent } from './perfil-usuario/perfil-usuario';
import { authGuard } from './auth/auth.guard';
import { GestionProductos } from './admin/gestion-productos/gestion-productos';
import { Productos } from './productos/productos';

// Importaciones de Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

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
        await router.navigate(['/primer-usuario']);
      }
    } catch (error) {
      console.error('Error durante la inicialización de la app:', error);
    }
  };
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      multi: true,
    },

    provideRouter([
      { path: '', component: Home, pathMatch: 'full' },
      { path: 'productos', component: Productos },
      { path: 'primer-usuario', component: PrimerUsuario },
      { path: 'perfil', component: PerfilUsuarioComponent, canActivate: [authGuard] }, // Nueva ruta de perfil
      {
        path: 'administracion',
        component: Admin,
        canActivate: [adminGuard],
        children: [
          { path: '', component: BienvenidaAdmin },
          { path: 'usuarios', component: GestionUsuarios },
          { path: 'personalizacion', component: PersonalizacionSitio },
          { path: 'productos', component: GestionProductos },
        ],
      },
    ]),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
};
