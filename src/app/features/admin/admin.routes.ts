import { Routes } from '@angular/router';
import { adminGuard } from '../../auth/admin-guard';

/**
 * ============================================================================
 * RUTAS LAZY LOADING - MÓDULO ADMINISTRACIÓN
 * ============================================================================
 * 
 * Configuración de rutas con carga diferida para el módulo de administración.
 * Esto mejora el rendimiento inicial de la aplicación.
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../admin/admin').then(m => m.Admin),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('../../admin/bienvenida/bienvenida').then(m => m.BienvenidaAdmin)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('../../admin/gestion-usuarios/gestion-usuarios').then(m => m.GestionUsuarios)
      },
      {
        path: 'personalizacion',
        loadComponent: () => import('../../admin/personalizacion-sitio/personalizacion-sitio').then(m => m.PersonalizacionSitio)
      },
      {
        path: 'novedades',
        loadComponent: () => import('../../admin/gestion-novedades/gestion-novedades').then(m => m.GestionNovedadesComponent)
      },
      {
        path: 'productos',
        loadComponent: () => import('../../admin/gestion-productos/gestion-productos').then(m => m.GestionProductos)
      },
      {
        path: 'categorias',
        loadComponent: () => import('../../admin/gestion-categorias/gestion-categorias').then(m => m.GestionCategoriasComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('../../admin/gestion-pedidos/gestion-pedidos.component').then(m => m.GestionPedidosComponent)
      },
      {
        path: 'estadisticas-vendedor',
        loadComponent: () => import('../../admin/estadisticas-vendedor/estadisticas-vendedor.component').then(m => m.EstadisticasVendedorComponent)
      },
      {
        path: 'pruebas',
        loadComponent: () => import('../../admin/panel-pruebas/panel-pruebas-simple').then(m => m.PanelPruebasComponent)
      }
    ]
  }
];
