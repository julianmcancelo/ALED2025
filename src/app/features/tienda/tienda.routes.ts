import { Routes } from '@angular/router';

/**
 * ============================================================================
 * RUTAS LAZY LOADING - MÓDULO TIENDA
 * ============================================================================
 * 
 * Configuración de rutas con carga diferida para el módulo de tienda.
 * Incluye productos, categorías, carrito y proceso de compra.
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

export const TIENDA_ROUTES: Routes = [
  {
    path: 'productos',
    loadComponent: () => import('../../tienda/tienda').then(m => m.TiendaComponent)
  },
  {
    path: 'categorias',
    loadComponent: () => import('../../categorias/categorias').then(m => m.CategoriasComponent)
  },
  {
    path: 'ofertas',
    loadComponent: () => import('../../ofertas/ofertas').then(m => m.OfertasComponent)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('../../detalle-producto/detalle-producto').then(m => m.DetalleProductoComponent)
  },
  {
    path: 'productos/:id',
    loadComponent: () => import('../../detalle-producto/detalle-producto').then(m => m.DetalleProductoComponent)
  },
  {
    path: 'carrito',
    loadComponent: () => import('../../carrito/carrito').then(m => m.Carrito)
  }
];
