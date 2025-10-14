// Importaciones principales de Angular para el componente
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2'; // Librería para alertas elegantes y modernas

// Importaciones de Angular Material para la interfaz de usuario
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

// Importamos nuestro servicio personalizado de autenticación
import { AuthService } from '../auth';

/**
 * ============================================================================
 * COMPONENTE DE INICIO DE SESIÓN - SISTEMA DE AUTENTICACIÓN
 * ============================================================================
 * 
 * Este componente maneja el proceso de autenticación de usuarios en ALED2025.
 * Se presenta como un modal dialog y permite a los usuarios iniciar sesión
 * con su email y contraseña.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * - Formulario reactivo con validaciones en tiempo real
 * - Autenticación segura con bcrypt
 * - Feedback visual durante el proceso de login
 * - Manejo de errores con mensajes user-friendly
 * - Integración con el sistema de roles (admin/usuario)
 * 
 * TECNOLOGÍAS UTILIZADAS:
 * - Angular Reactive Forms para validación
 * - Angular Material para la interfaz
 * - SweetAlert2 para notificaciones
 * - Backend personalizado para autenticación
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán - ALED III T.A.S.
 * AÑO: 2025
 */
@Component({
  selector: 'app-inicio-sesion',
  standalone: true, // Componente independiente para mejor tree-shaking
  imports: [
    CommonModule,              // Directivas básicas de Angular (*ngIf, *ngFor, etc.)
    ReactiveFormsModule,       // Para formularios reactivos con validación
    MatDialogModule,           // Para el modal dialog
    MatFormFieldModule,        // Campos de formulario de Material Design
    MatInputModule,            // Inputs estilizados de Material
    MatButtonModule,           // Botones de Material Design
    MatProgressSpinnerModule,  // Spinner de carga durante autenticación
    MatIconModule,             // Iconos de Material Design
  ],
  templateUrl: './inicio-sesion.html',
  styleUrls: ['./inicio-sesion.css'],
})
export class InicioDeSesion implements OnInit {
  
  // --- PROPIEDADES DEL COMPONENTE ---
  
  /**
   * Formulario reactivo que maneja los campos de email y contraseña.
   * Incluye validaciones automáticas y estados de error.
   */
  loginForm!: FormGroup;
  
  /**
   * Almacena mensajes de error específicos para mostrar al usuario.
   * null = sin errores, string = mensaje de error a mostrar
   */
  loginError: string | null = null;
  
  /**
   * Indica si el proceso de autenticación está en curso.
   * true = mostrando spinner de carga, false = formulario normal
   */
  isLoading = false;

  // --- INYECCIÓN DE DEPENDENCIAS ---
  
  /**
   * FormBuilder: Servicio de Angular para crear formularios reactivos
   * con validaciones y control de estado
   */
  private fb = inject(FormBuilder);
  
  /**
   * AuthService: Nuestro servicio personalizado que maneja la autenticación
   * incluyendo login, logout y gestión de sesiones
   */
  private authService = inject(AuthService);
  
  /**
   * MatDialogRef: Referencia al modal dialog para poder cerrarlo
   * después de un login exitoso
   */
  private dialogRef = inject(MatDialogRef<InicioDeSesion>);

  // --- MÉTODOS DEL CICLO DE VIDA DEL COMPONENTE ---

  /**
   * Método que se ejecuta automáticamente cuando el componente se inicializa.
   * Aquí configuramos el formulario reactivo con sus validaciones.
   */
  ngOnInit(): void {
    // Creamos el formulario reactivo con FormBuilder
    this.loginForm = this.fb.group({
      // Campo email con validaciones múltiples
      email: ['', [
        Validators.required,  // Campo obligatorio
        Validators.email      // Debe tener formato de email válido
      ]],
      // Campo password con validación básica
      password: ['', Validators.required], // Solo verificamos que no esté vacío
    });
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---

  /**
   * Maneja el envío del formulario de inicio de sesión.
   * Realiza la autenticación con el backend y maneja la respuesta.
   * 
   * @returns Promise<void> - Operación asíncrona que no retorna valor
   */
  async onSubmit(): Promise<void> {
    // --- VALIDACIÓN PREVIA ---
    // Verificamos que el formulario sea válido antes de proceder
    if (this.loginForm.invalid) {
      // Si hay errores de validación, no continuamos
      // Angular Material mostrará automáticamente los errores en la UI
      return;
    }

    // --- PREPARACIÓN PARA AUTENTICACIÓN ---
    // Activamos el estado de carga para mostrar el spinner
    this.isLoading = true;
    
    // Limpiamos cualquier error previo
    this.loginError = null;
    
    // Extraemos los valores del formulario de manera destructurada
    const { email, password } = this.loginForm.value;

    try {
      // --- PROCESO DE AUTENTICACIÓN ---
      // Llamamos al servicio de autenticación que maneja:
      // 1. Verificación de credenciales en backend
      // 2. Comparación de contraseña con bcrypt
      // 3. Establecimiento de sesión en localStorage
      // 4. Actualización del estado global de usuario
      await this.authService.login(email, password);
      
      // --- AUTENTICACIÓN EXITOSA ---
      // Si llegamos aquí, el login fue exitoso
      // Mostramos una notificación de bienvenida al usuario
      await Swal.fire({
        icon: 'success',                    // Icono de éxito (checkmark verde)
        title: '¡Bienvenido!',              // Título del mensaje
        text: 'Has iniciado sesión correctamente', // Mensaje descriptivo
        timer: 2000,                        // Se cierra automáticamente en 2 segundos
        showConfirmButton: false            // No mostrar botón "OK"
      });
      
      // Cerramos el modal de login ya que la autenticación fue exitosa
      this.dialogRef.close();
      
    } catch (error: any) {
      // --- MANEJO DE ERRORES DE AUTENTICACIÓN ---
      // Si el login falla, capturamos el error y lo manejamos apropiadamente
      
      // Registramos el error en la consola para debugging
      console.error('Error de inicio de sesión:', error);
      
      // Mostramos un mensaje de error user-friendly al usuario
      await Swal.fire({
        icon: 'error',                      // Icono de error (X roja)
        title: 'Error de autenticación',    // Título del error
        text: error.message || 'El correo o la contraseña son incorrectos.', // Mensaje específico o genérico
        confirmButtonText: 'Intentar de nuevo' // Texto del botón para cerrar
      });
      
      // NOTA: No cerramos el modal en caso de error para que el usuario
      // pueda corregir sus credenciales y volver a intentar
      
    } finally {
      // --- LIMPIEZA POST-PROCESAMIENTO ---
      // Este bloque se ejecuta SIEMPRE, ya sea que el login sea exitoso o falle
      // Desactivamos el estado de carga para ocultar el spinner
      this.isLoading = false;
    }
  }

  // --- NOTAS TÉCNICAS SOBRE EL FLUJO DE AUTENTICACIÓN ---
  /*
   * FLUJO COMPLETO DE INICIO DE SESIÓN:
   * 
   * 1. VALIDACIÓN FRONTEND:
   *    - Angular Reactive Forms valida formato de email
   *    - Verifica que los campos no estén vacíos
   *    - Muestra errores en tiempo real en la UI
   * 
   * 2. AUTENTICACIÓN BACKEND:
   *    - AuthService.login() busca el usuario por email en backend
   *    - Compara la contraseña ingresada con el hash bcrypt almacenado
   *    - Si coincide, crea la sesión y actualiza el estado global
   * 
   * 3. MANEJO DE RESPUESTA:
   *    - Éxito: Notificación + cierre de modal + redirección automática
   *    - Error: Mensaje específico + mantener modal abierto para reintentar
   * 
   * 4. PERSISTENCIA DE SESIÓN:
   *    - Los datos del usuario se guardan en localStorage
   *    - El estado se mantiene entre recargas de página
   *    - Los guards de ruta verifican automáticamente los permisos
   * 
   * SEGURIDAD IMPLEMENTADA:
   * - Contraseñas hasheadas con bcrypt (nunca se almacenan en texto plano)
   * - Validación tanto en frontend como backend
   * - Sesiones con expiración automática
   * - Verificación de roles para acceso a rutas protegidas
   */
}
