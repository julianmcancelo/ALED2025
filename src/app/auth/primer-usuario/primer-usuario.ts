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
  isLoading = false;
  private userService = inject(UserService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['admin@aled2025.com', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const { nombre, apellido, email, password } = this.registerForm.value;

      console.log('🔐 Creando primer usuario administrador...');
      
      // Verificar que no existan usuarios primero
      const usersExist = await this.userService.checkIfUsersExist();
      if (usersExist) {
        await Swal.fire({
          icon: 'warning',
          title: 'Ya existen usuarios',
          text: 'Ya hay usuarios en el sistema. No se puede crear el primer administrador.',
          confirmButtonText: 'Entendido',
        });
        this.router.navigate(['/']);
        return;
      }

      // --- ENCRIPTACIÓN DE LA CONTRASEÑA ---
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Crear usuario con todos los campos necesarios
      const adminUser = {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        dni: '00000000', // DNI por defecto para admin
        rol: 'admin' as const,
        novedades: false,
        terminos: true
      };

      await this.userService.createAdminUser(adminUser);
      
      console.log('✅ Primer usuario administrador creado exitosamente');

      await Swal.fire({
        icon: 'success',
        title: '¡Administrador creado!',
        html: `
          <p>Usuario administrador creado con éxito:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nombre:</strong> ${nombre} ${apellido}</p>
          <p>Ya puedes iniciar sesión con estas credenciales.</p>
        `,
        confirmButtonText: 'Continuar',
      });
      
      this.router.navigate(['/']); // Redirige a la página principal
    } catch (error) {
      console.error('❌ Error al crear el primer usuario:', error);
      
      let errorMessage = 'Hubo un error al crear el usuario.';
      
      // Manejo específico de errores
      if (error instanceof Error) {
        if (error.message.includes('email')) {
          errorMessage = 'El email ya está registrado.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'No tienes permisos para crear usuarios.';
        }
      }
      
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'Entendido',
      });
    } finally {
      this.isLoading = false;
    }
  }
}
