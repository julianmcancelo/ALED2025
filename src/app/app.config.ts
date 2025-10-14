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
import { PagoExitoso } from './pago-exitoso/pago-exitoso';
import { PagoFallido } from './pago-fallido/pago-fallido';
import { PagoPendiente } from './pago-pendiente/pago-pendiente';
import { MisPedidosComponent } from './mis-pedidos/mis-pedidos.component';
import { CategoriasComponent } from './categorias/categorias';
import { OfertasComponent } from './ofertas/ofertas';

// Configuración migrada a Supabase - Firebase eliminado

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
