import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth';
import { UserService } from '../services/user';
import Swal from 'sweetalert2';

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
  authService = inject(AuthService);
  private userService = inject(UserService);

  // Obtenemos la señal del usuario actual directamente desde el servicio.
  currentUser = this.authService.currentUserSignal;

  /**
   * Abre un modal para editar los datos de envío del usuario.
   */
  async editarDatosEnvio(): Promise<void> {
    const user = this.currentUser();
    if (!user?.id) return;

    const result = await Swal.fire({
      title: 'Datos de Envío',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input id="direccion" value="${user.direccion || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Calle y número">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input id="ciudad" value="${user.ciudad || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Ciudad">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
            <input id="codigoPostal" value="${user.codigoPostal || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Código Postal">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input id="telefono" value="${user.telefono || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Teléfono de contacto">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0077b6',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold'
      },
      preConfirm: () => {
        const direccion = (document.getElementById('direccion') as HTMLInputElement).value;
        const ciudad = (document.getElementById('ciudad') as HTMLInputElement).value;
        const codigoPostal = (document.getElementById('codigoPostal') as HTMLInputElement).value;
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value;

        if (!direccion || !ciudad || !codigoPostal || !telefono) {
          Swal.showValidationMessage('Por favor completa todos los campos');
          return false;
        }

        return { direccion, ciudad, codigoPostal, telefono };
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        await this.userService.updateUser(user.id, result.value);
        
        // Actualizar la señal del usuario actual
        this.authService.currentUserSignal.set({
          ...user,
          ...result.value
        });

        await Swal.fire({
          icon: 'success',
          title: 'Datos actualizados',
          text: 'Tus datos de envío han sido actualizados correctamente',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al actualizar tus datos. Por favor, intenta de nuevo.',
        });
      }
    }
  }
}
