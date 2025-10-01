import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';
import { map } from 'rxjs/operators';

/**
 * Guardia de ruta que solo permite el acceso a usuarios autenticados.
 * Si el usuario no ha iniciado sesión, lo redirige a la página de inicio.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUserSignal();

  if (currentUser) {
    // Si hay un usuario en la señal, permite el acceso.
    return true;
  } else {
    // Si no hay usuario, redirige a la página de inicio.
    return router.parseUrl('/');
  }
};
