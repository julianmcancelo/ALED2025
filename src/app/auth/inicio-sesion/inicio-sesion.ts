import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Importaciones de Angular Material
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

// Importamos nuestro servicio de autenticación.
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
  // Propiedades de la clase que faltaban
  loginForm!: FormGroup;
  loginError: string | null = null;
  isLoading = false;

  // Constructor completo con las inyecciones de dependencias
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public dialogRef: MatDialogRef<InicioDeSesion>,
  ) {}

  // Métodos ahora DENTRO de la clase
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = null;
      const { email, password } = this.loginForm.value;

      try {
        const success = await this.authService.login(email, password);
        if (success) {
          this.dialogRef.close();
        } else {
          this.loginError = 'El correo o la contraseña son incorrectos.';
        }
      } catch (error) {
        console.error('Ocurrió un error inesperado durante el login:', error);
        this.loginError = 'Ocurrió un error. Por favor, intente más tarde.';
      } finally {
        this.isLoading = false;
      }
    }
  }
}
