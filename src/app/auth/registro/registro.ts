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
import { UserService } from '../../services/user';

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
    private userService: UserService,
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

    const esUnico = await this.userService.verificarUsuarioUnico(dni, email);
    if (!esUnico) {
      this.registrationError = 'El DNI o el correo electrónico ya están registrados.';
      this.isLoading = false;
      return;
    }

    const userData = { ...this.registerForm.value };
    const salt = bcrypt.genSaltSync(10);
    userData.password = bcrypt.hashSync(userData.password, salt);
    delete userData.confirmPassword;
    userData.rol = 'usuario';

    this.userService
      .addUser(userData)
      .then(() => {
        this.snackBar.open('¡Usuario registrado con éxito!', 'Cerrar', { duration: 3000 });
        this.dialogRef.close();
      })
      .catch((error: any) => {
        console.error('Error al registrar el usuario:', error);
        this.registrationError = 'Ocurrió un error inesperado. Intente más tarde.';
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
