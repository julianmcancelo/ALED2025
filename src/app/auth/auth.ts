/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN
 * ============================================================================
 * 
 * Este servicio maneja toda la lógica de autenticación de usuarios:
 * - Login (inicio de sesión)
 * - Logout (cierre de sesión)
 * - Persistencia de sesión en localStorage
 * - Actualización en tiempo real con Firestore
 * - Gestión del estado del usuario actual
 * 
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * ============================================================================
 */

import { Injectable, inject, signal } from '@angular/core';
import { UserService } from '../servicios/user';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';  // Librería para hash de contraseñas
import { Firestore, doc, onSnapshot, DocumentSnapshot } from '@angular/fire/firestore';
import { Unsubscribe } from 'firebase/firestore';

/**
 * Interfaz que define la estructura de un usuario en nuestra aplicación.
 * 
 * Esta interfaz asegura que todos los objetos de usuario tengan
 * las propiedades necesarias y del tipo correcto (type safety).
 */
export interface AppUser {
  id: string;                    // ID único del usuario en Firestore
  email: string | null;          // Email del usuario (puede ser null)
  nombre: string;                // Nombre del usuario
  apellido: string;              // Apellido del usuario
  rol: 'admin' | 'usuario';      // Rol: solo puede ser 'admin' o 'usuario'
  password?: string;             // Contraseña hasheada (opcional para seguridad)
  
  // --- Campos opcionales para dirección de entrega ---
  // El símbolo '?' indica que son opcionales (pueden no existir)
  domicilio?: string;            // Campo legacy (compatibilidad con versiones anteriores)
  direccion?: string;            // Nueva dirección (formato mejorado)
  ciudad?: string;               // Ciudad de envío
  codigoPostal?: string;         // Código postal
  telefono?: string;             // Teléfono de contacto
}

/**
 * Servicio Injectable de Angular para gestión de autenticación.
 * 
 * @Injectable({ providedIn: 'root' }) significa que este servicio es un Singleton:
 * - Se crea una sola instancia para toda la aplicación
 * - Se puede inyectar en cualquier componente o servicio
 * - Angular se encarga de su ciclo de vida
 */
@Injectable({
  providedIn: 'root',  // Singleton a nivel de aplicación
})
export class AuthService {
  
  // --- INYECCIÓN DE DEPENDENCIAS ---
  // Usamos inject() (forma moderna de Angular) en lugar del constructor
  private userService: UserService = inject(UserService);  // Servicio para operaciones con usuarios en Firestore
  private router: Router = inject(Router);                 // Router para navegación
  private firestore: Firestore = inject(Firestore);        // Instancia de Firestore

  // --- CONSTANTES ---
  // Clave para guardar la sesión en localStorage del navegador
  private readonly USER_STORAGE_KEY = 'app_user_session';
  
  // Referencia a la suscripción de Firestore (para poder cancelarla después)
  private userSubscription: Unsubscribe | null = null;

  // --- SIGNAL DEL USUARIO ACTUAL ---
  // Signal es la nueva forma reactiva de Angular (desde v16)
  // Ventajas sobre BehaviorSubject:
  // - Más simple y directo
  // - Mejor rendimiento
  // - Integración nativa con Angular
  // 
  // Valores posibles:
  // - undefined: No sabemos aún si hay sesión (estado inicial)
  // - null: No hay sesión activa (usuario no logueado)
  // - AppUser: Hay un usuario logueado
  currentUserSignal = signal<AppUser | null | undefined>(undefined);

  /**
   * Constructor del servicio.
   * Se ejecuta una sola vez cuando Angular crea la instancia.
   */
  constructor() {
    // Al iniciar el servicio, intentamos restaurar la sesión guardada
    this.cargarSesionDesdeStorage();
  }

  private cargarSesionDesdeStorage(): void {
    console.log('🔐 Cargando sesión desde localStorage...');
    
    try {
      const userDataString = localStorage.getItem(this.USER_STORAGE_KEY);
      console.log('📦 Datos en localStorage:', userDataString);

      if (userDataString) {
        const appUser: AppUser = JSON.parse(userDataString);
        console.log('👤 Usuario parseado:', appUser);

        // --- VALIDACIÓN DE SESIÓN ---
        // Verificamos que el objeto de usuario tenga un ID. Si no lo tiene, la sesión es inválida.
        if (appUser && appUser.id) {
          console.log('✅ Sesión válida encontrada, restaurando usuario:', appUser.email);
          this.currentUserSignal.set(appUser);
          this.listenToCurrentUser(appUser.id);
        } else {
          // Si los datos son inválidos, limpiamos todo.
          console.error('❌ Sesión inválida encontrada en localStorage. Limpiando...');
          localStorage.removeItem(this.USER_STORAGE_KEY);
          this.currentUserSignal.set(null);
        }
      } else {
        console.log('📭 No hay datos de sesión en localStorage');
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar la sesión desde localStorage:', error);
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Se suscribe a los cambios del documento del usuario actual en Firestore.
   * @param userId - El ID del usuario a escuchar.
   */
  private listenToCurrentUser(userId: string): void {
    console.log('🔍 Iniciando suscripción a usuario:', userId);
    
    if (this.userSubscription) {
      console.log('🚫 Cancelando suscripción anterior');
      this.userSubscription();
    }

    const userDocRef = doc(this.firestore, 'users', userId);
    console.log('📄 Referencia del documento:', `users/${userId}`);
    
    this.userSubscription = onSnapshot(userDocRef, 
      (snapshot: DocumentSnapshot) => {
        console.log('🔄 Snapshot recibido:', {
          exists: snapshot.exists(),
          id: snapshot.id,
          data: snapshot.exists() ? snapshot.data() : null
        });
        
        if (snapshot.exists()) {
          const updatedUser = { id: snapshot.id, ...snapshot.data() } as AppUser;
          console.log('✅ Usuario actualizado desde Firestore:', updatedUser.email);
          this.currentUserSignal.set(updatedUser);
          localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(updatedUser));
        } else {
          console.log('❌ Usuario no encontrado en Firestore, cerrando sesión');
          this.logout();
        }
      },
      (error) => {
        console.error('❌ Error en suscripción de Firestore:', error);
        console.error('❌ Detalles del error:', {
          code: error.code,
          message: error.message,
          userId: userId
        });
        // No cerrar sesión por errores de red, solo por usuario no encontrado
      }
    );
  }

  async login(email: string, password: string): Promise<void> {
    const userProfile = await this.userService.getUserByEmail(email);
    if (!userProfile) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const passwordIsValid = userProfile.password && bcrypt.compareSync(password, userProfile.password);
    if (!passwordIsValid) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const appUser: AppUser = {
      ...userProfile,
      id: userProfile.id, // Usar 'id' en lugar de 'uid'
    };

    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(appUser));
    this.currentUserSignal.set(appUser);

    this.listenToCurrentUser(appUser.id); // Usar 'id'

    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    console.log('🚀 Cerrando sesión de usuario');
    console.trace('🔍 Stack trace del logout:'); // Para ver quién llama al logout
    
    // Al cerrar sesión, cancelamos la suscripción a los cambios.
    if (this.userSubscription) {
      console.log('🚫 Cancelando suscripción de Firestore');
      this.userSubscription();
      this.userSubscription = null;
    }

    console.log('🗑️ Limpiando localStorage');
    localStorage.removeItem(this.USER_STORAGE_KEY);
    this.currentUserSignal.set(null);
    
    console.log('📤 Redirigiendo a página principal');
    this.router.navigate(['/']);
  }
}
