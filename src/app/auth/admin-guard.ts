import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

/**
 * Un guardia de ruta funcional que protege el acceso a las rutas de administrador.
 * @returns 'true' si el usuario puede acceder, o una URL de redirección si no.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  // Inyectamos los servicios necesarios.
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos el usuario actual desde el signal del servicio de autenticación.
  const currentUser = authService.currentUserSignal();

  // Comprobamos si el usuario está logueado y si su rol es 'admin'.
  if (currentUser && currentUser['rol'] === 'admin') {
    // Si cumple las condiciones, permitimos el acceso a la ruta.
    return true;
  } else {
    // Si no cumple, lo redirigimos a la página de inicio.
    console.log('Acceso denegado. Se requieren permisos de administrador.');
    return router.parseUrl('/');
  }
};
