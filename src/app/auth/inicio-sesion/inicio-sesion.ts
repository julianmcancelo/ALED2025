import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Importaciones de Angular Material
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

// Importamos nuestros servicios de autenticación.
import { UserSupabaseService } from '../../servicios/user-supabase.service';
import { AuthService } from '../auth';

@Component({
  selector: 'app-inicio-sesion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './inicio-sesion.html',
  styleUrls: ['./inicio-sesion.css'],
})
export class InicioDeSesion implements OnInit {
  loginForm!: FormGroup;
  loginError: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userSupabaseService: UserSupabaseService,
    private authService: AuthService,
    private dialogRef: MatDialogRef<InicioDeSesion>
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.loginError = null;
    const { email, password } = this.loginForm.value;

    try {
      // Simplemente llamamos al método de login del servicio.
      const usuario = await this.userSupabaseService.verificarCredenciales(email, password);
      if (!usuario) {
        throw new Error('Credenciales inválidas');
      }
      
      // Establecer el usuario en el AuthService usando el método de guardado forzado
      this.authService.forceSaveSession(usuario);
      
      // Verificar que se guardó correctamente
      setTimeout(() => {
        this.authService.debugSession();
      }, 200);
      
      // Si la promesa se resuelve, el login fue exitoso y cerramos el diálogo.
      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente',
        timer: 2000,
        showConfirmButton: false
      });
      this.dialogRef.close();
    } catch (error: any) {
      // Si la promesa se rechaza, hubo un error.
      console.error('Error de inicio de sesión:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: error.message || 'El correo o la contraseña son incorrectos.',
        confirmButtonText: 'Intentar de nuevo'
      });
    } finally {
      this.isLoading = false;
    }
  }
}
