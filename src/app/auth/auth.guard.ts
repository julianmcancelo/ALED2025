import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

/**
 * Guardia de ruta que solo permite el acceso a usuarios autenticados.
 * Si el usuario no ha iniciado sesión, lo redirige a la página de inicio.
 * MIGRADO A SUPABASE
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUserSignal();

  if (currentUser) {
    // Si hay un usuario autenticado, permite el acceso.
    console.log('✅ Usuario autenticado:', currentUser.email);
    return true;
  } else {
    // Si no hay usuario, redirige a la página de inicio.
    console.log('❌ Usuario no autenticado, redirigiendo al inicio');
    return router.parseUrl('/');
  }
};
