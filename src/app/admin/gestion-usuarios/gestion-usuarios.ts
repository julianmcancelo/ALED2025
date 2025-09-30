import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user';
import { Observable } from 'rxjs';

/**
 * @component GestionUsuarios
 * Componente para mostrar y gestionar la lista de usuarios.
 */
@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private userService = inject(UserService);

  // --- PROPIEDADES ---

  /**
   * @property usuarios$
   * Un Observable que contiene la lista de usuarios.
   * El signo '$' al final es una convención para indicar que es un stream de datos.
   * Lo obtenemos directamente del servicio.
   */
  protected usuarios$: Observable<any[]>;

  /**
   * Constructor del componente.
   * Se ejecuta una sola vez cuando el componente es creado.
   */
  constructor() {
    // Inicializamos la propiedad 'usuarios$' llamando al método del servicio.
    this.usuarios$ = this.userService.getUsers();
  }

  // --- MÉTODOS DE ACCIÓN (para el futuro) ---

  /**
   * Maneja la acción de editar un usuario.
   * @param usuario - El objeto de usuario a editar.
   */
  editarUsuario(usuario: any): void {
    // Lógica futura para abrir un modal de edición.
    console.log('Editando usuario:', usuario);
    alert(`Funcionalidad "Editar" para ${usuario.nombre} aún no implementada.`);
  }

  /**
   * Maneja la acción de eliminar un usuario.
   * @param idUsuario - El ID del usuario a eliminar.
   */
  eliminarUsuario(idUsuario: string): void {
    // Lógica futura para confirmar y eliminar el usuario.
    console.log('Eliminando usuario con ID:', idUsuario);
    alert(`Funcionalidad "Eliminar" para ID ${idUsuario} aún no implementada.`);
  }
}
