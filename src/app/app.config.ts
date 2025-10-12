import {
  ApplicationConfig,
  provideZoneChangeDetection,
  inject,
  importProvidersFrom,
  APP_INITIALIZER,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { UserSupabaseService } from './servicios/user-supabase.service';
import { AuthService } from './auth/auth';
import { HttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

// Importamos los componentes y el nuevo guardia
import { Home } from './inicio/home';
import { TiendaComponent } from './tienda/tienda';
import { CategoriasComponent } from './categorias/categorias';
import { DetalleProductoComponent } from './detalle-producto/detalle-producto';
import { Admin } from './admin/admin';
import { GestionProductos } from './admin/gestion-productos/gestion-productos';
import { PerfilUsuarioComponent } from './perfil-usuario/perfil-usuario';
import { PagoExitosoComponent } from './pago-exitoso/pago-exitoso.component';
import { PagoFallidoComponent } from './pago-fallido/pago-fallido.component';
import { PagoPendienteComponent } from './pago-pendiente/pago-pendiente.component';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin-guard';
import { TestCategoriasComponent } from './test-categorias/test-categorias.component';
import { TestGeminiComponent } from './test-gemini/test-gemini.component';
import { MisPedidosComponent } from './mis-pedidos/mis-pedidos.component';
import { PrimerUsuario } from './auth/primer-usuario/primer-usuario';
import { BienvenidaAdmin } from './admin/bienvenida/bienvenida';
import { GestionUsuarios } from './admin/gestion-usuarios/gestion-usuarios';
import { PersonalizacionSitio } from './admin/personalizacion-sitio/personalizacion-sitio';
import { GestionNovedadesComponent } from './admin/gestion-novedades/gestion-novedades';
import { GestionPedidosComponent } from './admin/gestion-pedidos/gestion-pedidos.component';
// Función Factory para el APP_INITIALIZER - MIGRADO A SUPABASE
const initializeAppFactory = () => {
  const userService = inject(UserSupabaseService);
  const authService = inject(AuthService);
  const router = inject(Router);
  return async () => {
    try {
      console.log('🚀 Inicializando aplicación con Supabase...');
      
      // Inicializar el AuthService para cargar sesión desde localStorage
      // El constructor ya se encarga de esto, pero nos aseguramos de que esté inicializado
      console.log('🔐 Inicializando AuthService...');
      
      const usersExist = await userService.checkIfUsersExist();
      if (!usersExist) {
        console.log('👤 No hay usuarios, redirigiendo a primer usuario');
        await router.navigate(['/primer-usuario']);
      } else {
        console.log('✅ Usuarios existentes encontrados');
      }
    } catch (error) {
      console.error('❌ Error durante la inicialización de la app:', error);
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
      { path: 'ofertas', component: TiendaComponent }, // Ruta de ofertas (usa el mismo componente con filtros)
      { path: 'productos/:id', component: DetalleProductoComponent }, // Ruta para el detalle del producto
      { path: 'producto/:id', component: DetalleProductoComponent }, // Ruta alternativa para el detalle del producto
      { path: 'primer-usuario', component: PrimerUsuario },
      { path: 'perfil', component: PerfilUsuarioComponent, canActivate: [authGuard] }, // Nueva ruta de perfil
      { path: 'mis-pedidos', component: MisPedidosComponent, canActivate: [authGuard] }, // Nueva ruta de mis pedidos
      { path: 'pago-exitoso', component: PagoExitosoComponent },
      { path: 'pago-fallido', component: PagoFallidoComponent },
      { path: 'pago-pendiente', component: PagoPendienteComponent },
      { path: 'test-categorias', component: TestCategoriasComponent }, // Ruta de prueba para categorías
      { path: 'test-gemini', component: TestGeminiComponent }, // Ruta de prueba para Gemini AI 2.5 Flash
      {
        path: 'administracion',
        component: Admin, // ← Componente padre que contiene el sidebar
        canActivate: [adminGuard],
        children: [
          { path: '', component: BienvenidaAdmin },
          { path: 'usuarios', component: GestionUsuarios },
          { path: 'personalizacion', component: PersonalizacionSitio },
          { path: 'novedades', component: GestionNovedadesComponent },
          { path: 'productos', component: GestionProductos }, // Componente con Supabase
          { path: 'pedidos', component: GestionPedidosComponent }, // Gestión de Pedidos
        ],
      },
    ]),
  ],
};
