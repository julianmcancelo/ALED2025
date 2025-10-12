import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

/**
 * Un guardia de ruta funcional que protege el acceso a las rutas de administrador.
 * @returns 'true' si el usuario puede acceder, o una URL de redirección si no.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  // Inyectamos los servicios necesarios - MIGRADO A SUPABASE
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos el usuario actual desde el servicio de autenticación migrado
  const currentUser = authService.currentUserSignal();

  console.log('🔐 AdminGuard - Verificando acceso a:', state.url);
  console.log('👤 Usuario actual:', currentUser ? {
    email: currentUser.email,
    rol: currentUser.rol,
    id: currentUser.id
  } : 'No hay usuario');

  // Comprobamos si el usuario está logueado y si su rol es 'admin'.
  if (currentUser && currentUser.rol === 'admin') {
    // Si cumple las condiciones, permitimos el acceso a la ruta.
    console.log('✅ Acceso autorizado para admin:', currentUser.email);
    return true;
  } else {
    // Si no cumple, lo redirigimos a la página de inicio.
    console.log('❌ Acceso denegado. Se requieren permisos de administrador.');
    console.log('🔄 Redirigiendo a la página principal...');
    return router.parseUrl('/');
  }
};
