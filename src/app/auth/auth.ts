import { Injectable, inject, signal } from '@angular/core';
import { UserService } from '../services/user';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';

// Definimos una interfaz para nuestro objeto de usuario.
// Esto asegura que siempre tengamos la misma estructura de datos.
export interface AppUser {
  uid: string;
  email: string | null;
  nombre: string;
  rol: 'admin' | 'usuario';
  // ... otros campos que puedas tener.
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private userService: UserService = inject(UserService);
  private router: Router = inject(Router);

  // --- CLAVE PARA LOCALSTORAGE ---
  /**
   * Usamos una constante para la clave de localStorage.
   * Esto evita errores de tipeo y facilita futuras búsquedas o modificaciones.
   */
  private readonly USER_STORAGE_KEY = 'app_user_session';

  // --- SEÑAL DE ESTADO (SIGNAL) ---
  /**
   * 'currentUserSignal' es la fuente de verdad sobre el usuario actual.
   * - AppUser: Un usuario ha iniciado sesión.
   * - null: No hay sesión activa.
   * - undefined: Estado inicial, la app aún no ha comprobado si existe una sesión guardada.
   */
  currentUserSignal = signal<AppUser | null | undefined>(undefined);

  constructor() {
    // --- LÓGICA DE ARRANQUE: RESTAURAR SESIÓN ---
    // Este código se ejecuta una sola vez, cuando el servicio es creado al iniciar la app.
    this.cargarSesionDesdeStorage();
  }

  /**
   * Comprueba si hay una sesión de usuario guardada en localStorage.
   * Si la encuentra, la carga y actualiza el estado de la aplicación.
   */
  private cargarSesionDesdeStorage(): void {
    try {
      // 1. Intentamos obtener el item desde localStorage.
      const userDataString = localStorage.getItem(this.USER_STORAGE_KEY);

      if (userDataString) {
        // 2. Si existe, lo parseamos de JSON string a un objeto.
        const appUser: AppUser = JSON.parse(userDataString);
        // 3. Actualizamos nuestra señal. La aplicación ahora sabe que el usuario está logueado.
        this.currentUserSignal.set(appUser);
      } else {
        // 4. Si no hay datos, significa que no hay sesión activa.
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      // Si ocurre un error (ej: datos corruptos en localStorage),
      // lo más seguro es limpiar el estado.
      console.error('Error al cargar la sesión desde localStorage:', error);
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Inicia sesión comparando la contraseña hasheada con bcrypt.
   */
  async login(email: string, password: string): Promise<void> {
    // 1. Buscamos al usuario por su email en Firestore.
    const userProfile = await this.userService.getUserByEmail(email);
    if (!userProfile) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    // 2. Comparamos la contraseña proporcionada con el hash almacenado.
    const passwordIsValid = bcrypt.compareSync(password, userProfile.password);
    if (!passwordIsValid) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    // 3. Creamos nuestro objeto de usuario para la aplicación.
    const appUser: AppUser = {
      uid: userProfile.id,
      email: userProfile.email,
      ...userProfile,
    };

    // --- GUARDAR SESIÓN ---
    // 4. Guardamos el objeto de usuario en localStorage como un string JSON.
    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(appUser));

    // 5. Actualizamos la señal para que toda la app reaccione al nuevo estado.
    this.currentUserSignal.set(appUser);

    // 6. Redirigimos al usuario a la página principal.
    this.router.navigate(['/']);
  }

  /**
   * Cierra la sesión del usuario actual.
   */
  async logout(): Promise<void> {
    // --- LIMPIAR SESIÓN ---
    // 1. Eliminamos los datos del usuario de localStorage.
    localStorage.removeItem(this.USER_STORAGE_KEY);

    // 2. Actualizamos la señal a 'null' para indicar que no hay sesión.
    this.currentUserSignal.set(null);

    // 3. Redirigimos al usuario a la página de inicio.
    this.router.navigate(['/']);
  }
}
