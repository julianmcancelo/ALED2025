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

// Importamos nuestros servicios.
import { UserService } from '../../servicios/user';
import { TarjetaVirtualService } from '../../servicios/tarjeta-virtual.service';

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
    private tarjetaVirtualService: TarjetaVirtualService,
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
      this.isLoading = false;
      await Swal.fire({
        icon: 'error',
        title: 'Usuario ya existe',
        text: 'El DNI o el correo electrónico ya están registrados.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const userData = { ...this.registerForm.value };
    const salt = bcrypt.genSaltSync(10);
    userData.password = bcrypt.hashSync(userData.password, salt);
    delete userData.confirmPassword;
    userData.rol = 'usuario';

    this.userService
      .addUser(userData)
      .then(async (docRef) => {
        console.log('✅ Usuario registrado exitosamente con ID:', docRef.id);
        
        // Crear automáticamente la tarjeta virtual para el nuevo usuario
        try {
          const nombreCompleto = `${userData.nombre} ${userData.apellido}`;
          const tarjetaVirtual = await this.tarjetaVirtualService.crearTarjetaParaUsuario(
            docRef.id,
            nombreCompleto
          );
          
          console.log('✅ Tarjeta virtual creada exitosamente:', tarjetaVirtual.id);
          
          await Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            html: `
              <p>Usuario registrado con éxito</p>
              <p><small>Se ha creado automáticamente una tarjeta virtual para realizar pagos de prueba</small></p>
            `,
            timer: 3000,
            showConfirmButton: false
          });
        } catch (tarjetaError) {
          console.error('⚠️ Error al crear tarjeta virtual:', tarjetaError);
          
          // El usuario se registró correctamente, pero falló la creación de la tarjeta
          // Mostrar mensaje de éxito pero con advertencia
          await Swal.fire({
            icon: 'warning',
            title: 'Usuario registrado',
            html: `
              <p>El usuario se registró correctamente</p>
              <p><small>Hubo un problema al crear la tarjeta virtual. Contacte al administrador.</small></p>
            `,
            confirmButtonText: 'Entendido'
          });
        }
        
        this.dialogRef.close();
      })
      .catch(async (error: any) => {
        console.error('❌ Error al registrar el usuario:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error en el registro',
          text: 'Ocurrió un error inesperado. Intente más tarde.',
          confirmButtonText: 'Entendido'
        });
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
}
