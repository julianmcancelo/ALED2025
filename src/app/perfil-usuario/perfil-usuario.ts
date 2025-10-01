import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth';

/**
 * @component PerfilUsuarioComponent
 * Muestra la información del perfil del usuario que ha iniciado sesión.
 */
@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-usuario.html',
  styleUrls: ['./perfil-usuario.css'],
})
export class PerfilUsuarioComponent {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  // Inyectamos el servicio de autenticación para acceder a los datos del usuario actual.
  authService = inject(AuthService);

  // Obtenemos la señal del usuario actual directamente desde el servicio.
  // La plantilla HTML accederá a esta señal para mostrar los datos.
  currentUser = this.authService.currentUserSignal;
}
