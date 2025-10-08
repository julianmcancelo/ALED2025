import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../servicios/user';
import Swal from 'sweetalert2';
import * as bcrypt from 'bcryptjs'; // Importar bcrypt

// Importaciones de Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-primer-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './primer-usuario.html',
  styleUrl: './primer-usuario.css',
})
export class PrimerUsuario {
  registerForm: FormGroup;
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    try {
      const { nombre, email, password } = this.registerForm.value;

      // --- ENCRIPTACIÓN DE LA CONTRASEÑA ---
      // 1. Generamos un 'salt' para asegurar que el hash sea único.
      const salt = bcrypt.genSaltSync(10);
      // 2. Hasheamos la contraseña.
      const hashedPassword = bcrypt.hashSync(password, salt);

      // 3. Enviamos los datos con la contraseña ya hasheada al servicio.
      await this.userService.createAdminUser({ nombre, email, password: hashedPassword });

      await Swal.fire({
        icon: 'success',
        title: '¡Administrador creado!',
        text: 'Usuario administrador creado con éxito',
        confirmButtonText: 'Continuar',
      });
      this.router.navigate(['/']); // Redirige a la página principal
    } catch (error) {
      console.error('Error al crear el primer usuario:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al crear el usuario. Revisa la consola.',
        confirmButtonText: 'Entendido',
      });
    }
  }
}
