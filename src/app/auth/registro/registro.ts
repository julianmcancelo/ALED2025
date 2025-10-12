import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as bcrypt from 'bcryptjs';
import Swal from 'sweetalert2';

// Importaciones de Angular Material
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

// Importamos nuestro servicio de usuario.
import { UserSupabaseService } from '../../servicios/user-supabase.service';

/**
 * Validador personalizado para comprobar que dos campos de contraseña coinciden.
 */
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css'],
})
export class Registro implements OnInit {
  registerForm!: FormGroup;
  registrationError: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserSupabaseService,
    public dialogRef: MatDialogRef<Registro>,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        dni: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        novedades: [false],
        terminos: [false, Validators.requiredTrue],
      },
      {
        validators: passwordMatchValidator,
      },
    );
  }

  async onSubmit(): Promise<void> {
    if (!this.registerForm.valid) return;

    this.isLoading = true;
    this.registrationError = null;
    const { dni, email } = this.registerForm.value;

    try {
      // Verificar si el usuario ya existe por email
      const usuarioExistente = await this.userService.getUserByEmail(email).toPromise();
      if (usuarioExistente) {
        this.isLoading = false;
        await Swal.fire({
          icon: 'error',
          title: 'Usuario ya existe',
          text: 'El correo electrónico ya está registrado.',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      const userData = {
        nombre: this.registerForm.value.nombre,
        apellido: this.registerForm.value.apellido,
        dni: this.registerForm.value.dni,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        rol: 'cliente' as const,
        novedades: this.registerForm.value.novedades || false,
        terminos: this.registerForm.value.terminos || false
      };

      await this.userService.createUser(userData).toPromise();
      
      await Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: 'Usuario registrado con éxito',
        timer: 2000,
        showConfirmButton: false
      });
      this.dialogRef.close();
      
    } catch (error: any) {
      console.error('Error al registrar el usuario:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: 'Ocurrió un error inesperado. Intente más tarde.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.isLoading = false;
    }
  }
}
