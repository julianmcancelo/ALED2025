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
import { UserService } from '../services/user';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';  // Librería para hash de contraseñas
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
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
    try {
      const userDataString = localStorage.getItem(this.USER_STORAGE_KEY);

      if (userDataString) {
        const appUser: AppUser = JSON.parse(userDataString);

        // --- VALIDACIÓN DE SESIÓN ---
        // Verificamos que el objeto de usuario tenga un ID. Si no lo tiene, la sesión es inválida.
        if (appUser && appUser.id) {
          this.currentUserSignal.set(appUser);
          this.listenToCurrentUser(appUser.id);
        } else {
          // Si los datos son inválidos, limpiamos todo.
          console.error('Sesión inválida encontrada en localStorage. Limpiando...');
          localStorage.removeItem(this.USER_STORAGE_KEY);
          this.currentUserSignal.set(null);
        }
      } else {
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      console.error('Error al cargar la sesión desde localStorage:', error);
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Se suscribe a los cambios del documento del usuario actual en Firestore.
   * @param userId - El ID del usuario a escuchar.
   */
  private listenToCurrentUser(userId: string): void {
    if (this.userSubscription) {
      this.userSubscription();
    }

    const userDocRef = doc(this.firestore, 'users', userId);
    this.userSubscription = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const updatedUser = { id: snapshot.id, ...snapshot.data() } as AppUser; // Usar 'id'
        this.currentUserSignal.set(updatedUser);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } else {
        this.logout();
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const userProfile = await this.userService.getUserByEmail(email);
    if (!userProfile) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const passwordIsValid = bcrypt.compareSync(password, userProfile.password);
    if (!passwordIsValid) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const appUser: AppUser = {
      id: userProfile.id, // Usar 'id' en lugar de 'uid'
      email: userProfile.email,
      ...userProfile,
    };

    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(appUser));
    this.currentUserSignal.set(appUser);

    this.listenToCurrentUser(appUser.id); // Usar 'id'

    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    // Al cerrar sesión, cancelamos la suscripción a los cambios.
    if (this.userSubscription) {
      this.userSubscription();
      this.userSubscription = null;
    }

    localStorage.removeItem(this.USER_STORAGE_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
