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

// Importaciones de Firebase/Firestore
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { getApp } from 'firebase/app';
import { firebaseConfig } from './config/firebase.config';

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
import { GestionCategoriasComponent } from './admin/gestion-categorias/gestion-categorias';
import { PanelPruebasComponent } from './admin/panel-pruebas/panel-pruebas-simple';
import { PerfilUsuarioComponent } from './perfil-usuario/perfil-usuario';
import { authGuard } from './auth/auth.guard';
import { PagoExitoso } from './pago-exitoso/pago-exitoso';
import { PagoFallido } from './pago-fallido/pago-fallido';
import { PagoPendiente } from './pago-pendiente/pago-pendiente';
import { MisPedidosComponent } from './mis-pedidos/mis-pedidos.component';
import { CategoriasComponent } from './categorias/categorias';
import { OfertasComponent } from './ofertas/ofertas';
import { Carrito } from './carrito/carrito';

// Configuración de la aplicación

// Función Factory para el APP_INITIALIZER
const initializeAppFactory = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return async () => {
    console.log('🚀 Inicializando aplicación ALED2025...');
    
    // Usar Promise.race para evitar que el APP_INITIALIZER bloquee indefinidamente
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('⏱️ Timeout de inicialización - continuando...');
        resolve(true);
      }, 5000); // 5 segundos máximo
    });
    
    const initPromise = (async () => {
      try {
        // Primero probar la conexión con Firestore
        await userService.probarConexionFirestore();
        
        // Luego verificar si existen usuarios
        const usersExist = await userService.checkIfUsersExist();
        
        if (!usersExist) {
          console.log('🔐 Primera ejecución detectada - redirigiendo a configuración inicial');
          // Usar setTimeout para asegurar que el router esté listo
          setTimeout(() => {
            router.navigate(['/primer-usuario']);
          }, 500);
        } else {
          console.log('✅ Usuarios encontrados - aplicación lista');
        }
        return true;
      } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        console.log('⚠️ Continuando sin verificación de usuarios...');
        return true;
      }
    })();
    
    // Esperar el que termine primero (inicialización o timeout)
    await Promise.race([initPromise, timeoutPromise]);
    console.log('✅ APP_INITIALIZER completado');
  };
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideAnimations(),

    // Configuración de Firebase/Firestore - DEBE IR ANTES DEL APP_INITIALIZER
    provideFirebaseApp(() => {
      try {
        const app = initializeApp(firebaseConfig);
        console.log('🔥 Firebase App inicializada:', {
          name: app.name,
          projectId: firebaseConfig.projectId
        });
        return app;
      } catch (error) {
        console.error('❌ Error inicializando Firebase App:', error);
        throw error;
      }
    }),
    provideFirestore(() => {
      try {
        const firestore = getFirestore();
        console.log('📁 Firestore inicializado correctamente');
        return firestore;
      } catch (error) {
        console.error('❌ Error inicializando Firestore:', error);
        throw error;
      }
    }),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      multi: true,
    },
    
    provideRouter([
      // --- RUTAS PRINCIPALES ---
      { path: '', component: Home, pathMatch: 'full' },
      
      // --- LAZY LOADING: MÓDULO DE TIENDA ---
      {
        path: 'tienda',
        loadChildren: () => import('./features/tienda/tienda.routes').then(m => m.TIENDA_ROUTES)
      },
      
      // --- LAZY LOADING: MÓDULO DE ADMINISTRACIÓN ---
      {
        path: 'administracion',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },
      
      // --- LAZY LOADING: MÓDULO DE AUTENTICACIÓN ---
      {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },
      
      // --- RUTAS LEGACY (mantenidas por compatibilidad) ---
      { path: 'productos', component: TiendaComponent },
      { path: 'categorias', component: CategoriasComponent },
      { path: 'ofertas', component: OfertasComponent },
      { path: 'productos/:id', component: DetalleProductoComponent },
      { path: 'producto/:id', component: DetalleProductoComponent },
      { path: 'carrito', component: Carrito },
      { path: 'primer-usuario', component: PrimerUsuario },
      { path: 'perfil', component: PerfilUsuarioComponent, canActivate: [authGuard] },
      { path: 'pago-exitoso', component: PagoExitoso },
      { path: 'pago-fallido', component: PagoFallido },
      { path: 'pago-pendiente', component: PagoPendiente },
      { path: 'mis-pedidos', component: MisPedidosComponent, canActivate: [authGuard] },
      
      // --- RUTA WILDCARD ---
      { path: '**', redirectTo: '' }
    ])
  ]
};
