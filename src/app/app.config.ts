import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { UserService } from './servicios/user';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Importamos los componentes y el nuevo guardia
import { Home } from './inicio/home';
import { TiendaComponent } from './tienda/tienda';
import { DetalleProductoComponent } from './detalle-producto/detalle-producto';
import { Admin } from './admin/admin';
import { adminGuard } from './auth/admin-guard';
import { PrimerUsuario } from './auth/primer-usuario/primer-usuario';
import { BienvenidaAdmin } from './admin/bienvenida/bienvenida';
import { GestionUsuarios } from './admin/gestion-usuarios/gestion-usuarios';
import { PersonalizacionSitio } from './admin/personalizacion-sitio/personalizacion-sitio';
import { GestionNovedadesComponent } from './admin/gestion-novedades/gestion-novedades';
import { GestionProductos } from './admin/gestion-productos/gestion-productos'; // Nombre Correcto
import { GestionPedidosComponent } from './admin/gestion-pedidos/gestion-pedidos.component';
import { PerfilUsuarioComponent } from './perfil-usuario/perfil-usuario';
import { authGuard } from './auth/auth.guard';
import { PagoExitosoComponent } from './pago-exitoso/pago-exitoso.component';
import { PagoFallidoComponent } from './pago-fallido/pago-fallido.component';
import { PagoPendienteComponent } from './pago-pendiente/pago-pendiente.component';
import { MisPedidosComponent } from './mis-pedidos/mis-pedidos.component';
import { CategoriasComponent } from './categorias/categorias';

// Importaciones de Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAYof5X_SayXySktaeT1NZjfcWKBmqbxqM',
  authDomain: 'aled2025-5be25.firebaseapp.com',
  projectId: 'aled2025-5be25',
  storageBucket: 'aled2025-5be25.firebasestorage.app',
  messagingSenderId: '773634182293',
  appId: '1:773634182293:web:a91a4778c57065faca1f9c',
  measurementId: 'G-90LCBTBJLJ',
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
      { path: 'productos', component: TiendaComponent }, // Nueva ruta de la tienda
      { path: 'categorias', component: CategoriasComponent }, // Nueva ruta de categorías
      { path: 'productos/:id', component: DetalleProductoComponent }, // Ruta para el detalle del producto
      { path: 'producto/:id', component: DetalleProductoComponent }, // Ruta alternativa para el detalle del producto
      { path: 'primer-usuario', component: PrimerUsuario },
      { path: 'perfil', component: PerfilUsuarioComponent, canActivate: [authGuard] }, // Nueva ruta de perfil
      { path: 'mis-pedidos', component: MisPedidosComponent, canActivate: [authGuard] }, // Nueva ruta de mis pedidos
      { path: 'pago-exitoso', component: PagoExitosoComponent },
      { path: 'pago-fallido', component: PagoFallidoComponent },
      { path: 'pago-pendiente', component: PagoPendienteComponent },
      {
        path: 'administracion',
        component: Admin,
        canActivate: [adminGuard],
        children: [
          { path: '', component: BienvenidaAdmin },
          { path: 'usuarios', component: GestionUsuarios },
          { path: 'personalizacion', component: PersonalizacionSitio },
          { path: 'novedades', component: GestionNovedadesComponent },
          { path: 'productos', component: GestionProductos }, // Nombre Correcto
          { path: 'pedidos', component: GestionPedidosComponent }, // Gestión de Pedidos
        ],
      },
    ]),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
};
