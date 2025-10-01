import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

/**
 * @component EditarUsuarioComponent
 * Componente modal para editar la información de un usuario.
 * Se abre a través del servicio MatDialog de Angular Material.
 */
@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './editar-usuario.html',
})
export class EditarUsuarioComponent {
  /**
   * Almacena una copia de los datos del usuario que se está editando.
   * Se hace una copia para que los cambios no se reflejen en la tabla principal
   * hasta que el usuario haga clic en "Guardar Cambios".
   */
  usuarioEditable: any;

  constructor(
    // Referencia al propio diálogo modal, necesaria para cerrarlo.
    public dialogRef: MatDialogRef<EditarUsuarioComponent>,
    // Inyector para recibir los datos pasados desde el componente padre (GestionUsuarios).
    // En este caso, recibe el objeto de usuario a editar.
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // Creamos una copia superficial del objeto 'data' para evitar la mutación directa.
    this.usuarioEditable = { ...data };
  }

  /**
   * Se ejecuta cuando el usuario hace clic en el botón "Cancelar".
   * Cierra el diálogo sin devolver ningún dato, descartando los cambios.
   */
  onNoClick(): void {
    this.dialogRef.close();
  }

  /**
   * Se ejecuta cuando el usuario hace clic en "Guardar Cambios".
   * Cierra el diálogo y devuelve el objeto 'usuarioEditable' con los datos modificados
   * al componente que lo abrió.
   */
  guardarCambios(): void {
    this.dialogRef.close(this.usuarioEditable);
  }
}
