import { Routes } from '@angular/router';

/**
 * ============================================================================
 * RUTAS LAZY LOADING - MÓDULO AUTENTICACIÓN
 * ============================================================================
 * 
 * Configuración de rutas con carga diferida para el módulo de autenticación.
 * Incluye login, registro y configuración inicial.
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */

export const AUTH_ROUTES: Routes = [
  {
    path: 'primer-usuario',
    loadComponent: () => import('../../auth/primer-usuario/primer-usuario').then(m => m.PrimerUsuario)
  },
  {
    path: 'login',
    loadComponent: () => import('../../auth/inicio-sesion/inicio-sesion').then(m => m.InicioDeSesion)
  },
  {
    path: 'registro',
    loadComponent: () => import('../../auth/registro/registro').then(m => m.Registro)
  }
];
