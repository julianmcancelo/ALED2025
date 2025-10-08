import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../servicios/user';
import { AuthService, AppUser } from '../../auth/auth'; // Importar AuthService y AppUser
import { Observable } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog'; // Para modales
import { EditarUsuarioComponent } from './editar-usuario'; // Componente de edición
import Swal from 'sweetalert2';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, MatDialogModule], // Añadir MatDialogModule
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private userService = inject(UserService);
  private authService = inject(AuthService);
  public dialog = inject(MatDialog);

  protected usuarios$: Observable<any[]>;

  constructor() {
    this.usuarios$ = this.userService.getUsers();
  }

  /**
   * Abre un modal de Angular Material para editar los datos de un usuario.
   * @param usuario - El objeto completo del usuario que se va a editar.
   */
  editarUsuario(usuario: AppUser): void {
    // 1. Abrimos el diálogo modal, pasándole el componente 'EditarUsuarioComponent'.
    const dialogRef = this.dialog.open(EditarUsuarioComponent, {
      data: { ...usuario }, // Pasamos una copia del usuario al modal
    });

    // 2. Nos suscribimos al evento 'afterClosed()'. Este observable se dispara cuando el modal se cierra.
    dialogRef.afterClosed().subscribe(async (result) => {
      // 3. Verificamos si 'result' tiene datos. Si el usuario canceló, 'result' será undefined.
      if (result && result.id) {
        try {
          // 4. Si hay datos, llamamos al servicio para actualizar el usuario en Firestore.
          await this.userService.updateUser(result.id, {
            nombre: result.nombre,
            apellido: result.apellido,
            rol: result.rol,
          });
          // 5. Mostramos una notificación de éxito.
          Swal.fire('¡Actualizado!', 'El usuario ha sido actualizado correctamente.', 'success');
        } catch (error) {
          // 6. Si ocurre un error durante la actualización, lo capturamos y mostramos una alerta.
          console.error('Error al actualizar usuario:', error);
          Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
        }
      }
    });
  }

  /**
   * Inicia el proceso para eliminar un usuario, incluyendo una confirmación de seguridad.
   * @param usuario - El objeto completo del usuario a eliminar.
   */
  async eliminarUsuario(usuario: AppUser & { id: string }): Promise<void> {
    // 1. Obtenemos los datos del administrador que está realizando la acción.
    const admin = this.authService.currentUserSignal();
    if (!admin || !admin.email) {
      Swal.fire('Error', 'No se pudo identificar al administrador para la confirmación.', 'error');
      return;
    }

    // 2. Medida de seguridad: Impedir que un administrador se elimine a sí mismo.
    if (admin.id === usuario.id) {
      Swal.fire(
        'Acción no permitida',
        'No puedes eliminar tu propia cuenta de administrador desde esta interfaz.',
        'warning',
      );
      return;
    }

    // 3. Usamos SweetAlert2 para crear un diálogo de confirmación que pide la contraseña.
    const { value: password } = await Swal.fire({
      title: 'Confirmar Eliminación',
      input: 'password',
      inputLabel: `Para eliminar a ${usuario.nombre}, ingrese su contraseña de administrador`,
      inputPlaceholder: 'Ingrese su contraseña',
      showCancelButton: true,
      confirmButtonText: 'Confirmar y Eliminar',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true, // Muestra un spinner mientras se valida la contraseña.

      // 'preConfirm' es una función que se ejecuta antes de que la alerta se cierre.
      // Es ideal para validaciones asíncronas.
      preConfirm: async (password) => {
        try {
          // Obtenemos el perfil completo del admin para acceder a su contraseña hasheada.
          const adminProfile = await this.userService.getUserByEmail(admin.email!);
          // Comparamos la contraseña ingresada con el hash usando bcrypt.
          if (!adminProfile || !bcrypt.compareSync(password, adminProfile.password)) {
            // Si no coincide, mostramos un mensaje de error de validación.
            Swal.showValidationMessage('La contraseña es incorrecta');
            return false; // Evita que la promesa se resuelva y la alerta se cierre.
          }
          return true; // Si la contraseña es correcta, la validación pasa.
        } catch (error) {
          Swal.showValidationMessage('Error al verificar la contraseña');
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(), // Evita que se cierre la alerta al hacer clic fuera.
    });

    // 4. Si la validación 'preConfirm' fue exitosa, 'password' contendrá 'true'.
    if (password) {
      try {
        // Procedemos a eliminar el usuario a través del servicio.
        await this.userService.deleteUser(usuario.id);
        Swal.fire('¡Eliminado!', `El usuario ${usuario.nombre} ha sido eliminado.`, 'success');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
      }
    }
  }
}
