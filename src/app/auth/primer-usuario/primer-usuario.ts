import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user';
import Swal from 'sweetalert2';

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
      // Aquí en un caso real, primero crearíamos el usuario en Firebase Auth
      // y luego guardaríamos los datos en Firestore. Por simplicidad,
      // solo guardamos en Firestore como lo pide la estructura actual.
      await this.userService.createAdminUser({ nombre, email, password });
      await Swal.fire({
        icon: 'success',
        title: '¡Administrador creado!',
        text: 'Usuario administrador creado con éxito',
        confirmButtonText: 'Continuar'
      });
      this.router.navigate(['/']); // Redirige a la página principal
    } catch (error) {
      console.error('Error al crear el primer usuario:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un error al crear el usuario. Revisa la consola.',
        confirmButtonText: 'Entendido'
      });
    }
  }
}
