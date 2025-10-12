import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserSupabaseService } from '../../servicios/user-supabase.service';
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
  isLoading = false;
  private userService = inject(UserSupabaseService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;

    try {
      const { nombre, apellido, email, password } = this.registerForm.value;

      console.log('🔐 Creando primer usuario administrador...');

      // Crear el primer usuario administrador usando el servicio Supabase
      const nuevoAdmin = await this.userService.createUser({
        nombre,
        apellido,
        email,
        password,
        dni: '', // DNI opcional para el primer admin
        rol: 'admin',
        novedades: false,
        terminos: true
      }).toPromise();

      console.log('✅ Primer administrador creado exitosamente:', nuevoAdmin?.email);

      await Swal.fire({
        icon: 'success',
        title: '¡Administrador creado!',
        text: `Usuario administrador "${nombre}" creado con éxito. Ya puedes iniciar sesión.`,
        confirmButtonText: 'Ir al inicio',
        timer: 3000,
        timerProgressBar: true
      });

      this.router.navigate(['/']); // Redirige a la página principal
    } catch (error: any) {
      console.error('❌ Error al crear el primer usuario:', error);
      
      let errorMessage = 'Hubo un error al crear el usuario administrador.';
      
      if (error?.message?.includes('duplicate key')) {
        errorMessage = 'Ya existe un usuario con ese email.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Error al crear administrador',
        text: errorMessage,
        confirmButtonText: 'Intentar de nuevo',
      });
    } finally {
      this.isLoading = false;
    }
  }
}
