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
import { PerfilUsuarioComponent } from './perfil-usuario/perfil-usuario';
import { authGuard } from './auth/auth.guard';
import { PagoExitoso } from './pago-exitoso/pago-exitoso';
import { PagoFallido } from './pago-fallido/pago-fallido';
import { PagoPendiente } from './pago-pendiente/pago-pendiente';
import { MisPedidosComponent } from './mis-pedidos/mis-pedidos.component';
import { CategoriasComponent } from './categorias/categorias';
import { OfertasComponent } from './ofertas/ofertas';

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
      { path: '', component: Home, pathMatch: 'full' },
      { path: 'productos', component: TiendaComponent }, // Nueva ruta de la tienda
      { path: 'categorias', component: CategoriasComponent }, // Nueva ruta de categorías
      { path: 'ofertas', component: OfertasComponent }, // Nueva ruta de ofertas
      { path: 'productos/:id', component: DetalleProductoComponent }, // Ruta para el detalle del producto
      { path: 'producto/:id', component: DetalleProductoComponent }, // Ruta alternativa para el detalle del producto
      { path: 'primer-usuario', component: PrimerUsuario },
      { path: 'perfil', component: PerfilUsuarioComponent, canActivate: [authGuard] }, // Nueva ruta de perfil
      { path: 'mis-pedidos', component: MisPedidosComponent, canActivate: [authGuard] }, // Nueva ruta de mis pedidos
      { path: 'pago-exitoso', component: PagoExitoso },
      { path: 'pago-fallido', component: PagoFallido },
      { path: 'pago-pendiente', component: PagoPendiente },
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
  ],
};
