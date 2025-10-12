/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN
 * ============================================================================
 * 
 * Este servicio maneja toda la lógica de autenticación de usuarios:
 * - Login (inicio de sesión)
 * - Logout (cierre de sesión)
 * - Persistencia de sesión en localStorage
 * - Actualización en tiempo real con Supabase
 * - Gestión del estado del usuario actual
 * 
 * Autores: Cancelo Julian & Nicolas Otero
 * Materia: ALED III - T.A.S.
 * ============================================================================
 */

import { Injectable, inject, signal } from '@angular/core';
import { UserSupabaseService } from '../servicios/user-supabase.service';
import { AuthSupabaseService } from '../servicios/auth-supabase.service';
import { Router } from '@angular/router';

/**
 * Interfaz que define la estructura de un usuario en nuestra aplicación.
 * Esta es la interfaz unificada que se usa en toda la aplicación.
 */
export interface AppUser {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  rol: 'admin' | 'cliente';
  activo: boolean;
  
  // Campos opcionales para dirección de entrega
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  telefono?: string;
  
  // Campo legacy para compatibilidad
  domicilio?: string;
}

/**
 * Servicio Injectable de Angular para gestión de autenticación con Supabase.
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
  private authSupabaseService = inject(AuthSupabaseService);
  private userSupabaseService = inject(UserSupabaseService);
  private router = inject(Router);

  // --- CONSTANTES ---
  private readonly USER_STORAGE_KEY = 'app_user_session';

  // --- SIGNAL DEL USUARIO ACTUAL ---
  currentUserSignal = signal<AppUser | null | undefined>(undefined);

  /**
   * Constructor del servicio.
   */
  constructor() {
    console.log('🔐 Inicializando AuthService con Supabase...');
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación con Supabase
   */
  private initializeAuth(): void {
    console.log('🔐 Inicializando sistema de autenticación...');
    
    // Asegurar que localStorage esté disponible antes de cargar
    if (typeof window !== 'undefined' && window.localStorage) {
      // Pequeño delay para asegurar que todo esté inicializado
      setTimeout(() => {
        this.cargarSesionDesdeStorage();
      }, 100);
    } else {
      console.warn('⚠️ localStorage no disponible');
      this.currentUserSignal.set(null);
    }
    
    console.log('✅ Sistema de autenticación inicializado');
  }

  private cargarSesionDesdeStorage(): void {
    try {
      const userDataString = localStorage.getItem(this.USER_STORAGE_KEY);

      if (userDataString) {
        const appUser: AppUser = JSON.parse(userDataString);

        if (appUser && appUser.id) {
          this.currentUserSignal.set(appUser);
          console.log('✅ Sesión restaurada desde localStorage:', {
            email: appUser.email,
            rol: appUser.rol,
            id: appUser.id
          });
        } else {
          console.warn('⚠️ Sesión inválida en localStorage. Limpiando...');
          localStorage.removeItem(this.USER_STORAGE_KEY);
          this.currentUserSignal.set(null);
        }
      } else {
        console.log('ℹ️ No hay sesión guardada en localStorage');
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      console.error('❌ Error al cargar sesión desde localStorage:', error);
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<void> {
    try {
      console.log('🔑 Iniciando sesión con Supabase...');
      
      const user = await this.authSupabaseService.login(email, password).toPromise();
      
      if (user) {
        console.log('✅ Login exitoso');
        this.currentUserSignal.set(user);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async register(userData: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
  }): Promise<void> {
    try {
      console.log('📝 Registrando usuario con Supabase...');
      
      const user = await this.authSupabaseService.register(userData).toPromise();
      
      if (user) {
        console.log('✅ Registro exitoso');
        this.currentUserSignal.set(user);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Solo limpiar el estado local, no usar authSupabaseService
      this.currentUserSignal.set(null);
      localStorage.removeItem(this.USER_STORAGE_KEY);
      
      console.log('✅ Sesión cerrada correctamente');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      // Limpiar de todas formas
      this.currentUserSignal.set(null);
      localStorage.removeItem(this.USER_STORAGE_KEY);
      this.router.navigate(['/']);
    }
  }

  /**
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): boolean {
    const user = this.currentUserSignal();
    return user?.rol === 'admin';
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): AppUser | null | undefined {
    return this.currentUserSignal();
  }

  /**
   * Fuerza la recarga de la sesión desde localStorage
   */
  reloadSession(): void {
    console.log('🔄 Forzando recarga de sesión...');
    this.cargarSesionDesdeStorage();
  }

  /**
   * Método de debugging para verificar el estado de la sesión
   */
  debugSession(): void {
    const user = this.currentUserSignal();
    const localStorage_data = localStorage.getItem(this.USER_STORAGE_KEY);
    
    console.log('🔍 DEBUG SESSION:', {
      currentUser: user,
      localStorage_key: this.USER_STORAGE_KEY,
      localStorage_data: localStorage_data,
      localStorage_parsed: localStorage_data ? JSON.parse(localStorage_data) : null,
      localStorage_available: typeof window !== 'undefined' && !!window.localStorage,
      all_localStorage_keys: Object.keys(localStorage),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Fuerza el guardado de la sesión actual
   */
  forceSaveSession(user: AppUser): void {
    console.log('💾 Forzando guardado de sesión:', user.email);
    
    try {
      this.currentUserSignal.set(user);
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      
      // Verificar que se guardó correctamente
      const saved = localStorage.getItem(this.USER_STORAGE_KEY);
      if (saved) {
        console.log('✅ Sesión guardada correctamente');
      } else {
        console.error('❌ Error: No se pudo guardar la sesión');
      }
    } catch (error) {
      console.error('❌ Error al guardar sesión:', error);
    }
  }
}
