/**
 * ============================================================================
 * SERVICIO DE AUTENTICACIÓN CON SUPABASE
 * ============================================================================
 * 
 * Este servicio maneja toda la lógica de autenticación migrada a Supabase:
 * - Login (inicio de sesión)
 * - Logout (cierre de sesión)
 * - Persistencia de sesión en localStorage
 * - Actualización en tiempo real con Supabase
 * - Gestión del estado del usuario actual
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 * ============================================================================
 */

import { Injectable, inject, signal } from '@angular/core';
import { UserSupabaseService } from '../servicios/user-supabase.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabase } from '../config/supabase.config';
import { AppUser } from './auth';

/**
 * Servicio Injectable de Angular para gestión de autenticación con Supabase.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthSupabaseService {
  
  // Inyección de dependencias
  private userService = inject(UserSupabaseService);
  private router = inject(Router);

  // Signals para estado reactivo
  private currentUserSignal = signal<AppUser | null>(null);
  private isAuthenticatedSignal = signal<boolean>(false);

  // BehaviorSubjects para compatibilidad con código existente
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Getters para signals (nueva forma reactiva de Angular)
  get currentUser() {
    return this.currentUserSignal();
  }

  get isAuthenticated() {
    return this.isAuthenticatedSignal();
  }

  constructor() {
    console.log('🔐 Inicializando AuthSupabaseService...');
    this.initializeAuth();
  }

  /**
   * Inicializar autenticación al cargar el servicio
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Verificar si hay una sesión guardada en localStorage
      const savedUser = localStorage.getItem('currentUser');
      
      if (savedUser) {
        const user: AppUser = JSON.parse(savedUser);
        console.log('🔄 Restaurando sesión desde localStorage:', user.email);
        
        // Verificar que el usuario aún existe en Supabase
        const userExists = await this.userService.getUserById(user.id).toPromise();
        
        if (userExists) {
          this.setCurrentUser(userExists);
          console.log('✅ Sesión restaurada exitosamente');
        } else {
          console.log('⚠️ Usuario no encontrado, limpiando sesión');
          this.clearSession();
        }
      } else {
        console.log('ℹ️ No hay sesión guardada');
      }
    } catch (error) {
      console.error('❌ Error inicializando autenticación:', error);
      this.clearSession();
    }
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<{ success: boolean; message: string; user?: AppUser }> {
    console.log('🔐 Intentando login para:', email);
    
    try {
      // Verificar credenciales con Supabase
      const user = await this.userService.verificarCredenciales(email, password);
      
      if (!user) {
        console.log('❌ Credenciales inválidas para:', email);
        return {
          success: false,
          message: 'Email o contraseña incorrectos'
        };
      }

      // Login exitoso
      this.setCurrentUser(user);
      console.log('✅ Login exitoso para:', user.email);
      
      return {
        success: true,
        message: 'Login exitoso',
        user: user
      };
      
    } catch (error) {
      console.error('❌ Error durante login:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    console.log('🚪 Cerrando sesión...');
    
    try {
      // Limpiar sesión local
      this.clearSession();
      
      // Redirigir al inicio
      await this.router.navigate(['/']);
      
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error durante logout:', error);
    }
  }

  /**
   * Establecer usuario actual
   */
  private setCurrentUser(user: AppUser): void {
    // Actualizar signals
    this.currentUserSignal.set(user);
    this.isAuthenticatedSignal.set(true);
    
    // Actualizar BehaviorSubjects para compatibilidad
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    console.log('👤 Usuario establecido:', user.email, '- Rol:', user.rol);
  }

  /**
   * Limpiar sesión
   */
  private clearSession(): void {
    // Limpiar signals
    this.currentUserSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    
    // Limpiar BehaviorSubjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Limpiar localStorage
    localStorage.removeItem('currentUser');
    
    console.log('🧹 Sesión limpiada');
  }

  /**
   * Verificar si el usuario actual es administrador
   */
  isAdmin(): boolean {
    const user = this.currentUser;
    return user?.rol === 'admin';
  }

  /**
   * Verificar si el usuario actual es cliente
   */
  isCliente(): boolean {
    const user = this.currentUser;
    return user?.rol === 'cliente';
  }

  /**
   * Obtener el usuario actual de forma síncrona
   */
  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  /**
   * Obtener el usuario actual como Observable
   */
  getCurrentUser$(): Observable<AppUser | null> {
    return this.currentUser$;
  }

  /**
   * Verificar si está autenticado de forma síncrona
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Verificar si está autenticado como Observable
   */
  isLoggedIn$(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  /**
   * Actualizar perfil del usuario actual
   */
  async updateProfile(userData: Partial<AppUser>): Promise<{ success: boolean; message: string }> {
    const currentUser = this.currentUser;
    
    if (!currentUser) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    try {
      console.log('👤 Actualizando perfil del usuario:', currentUser.email);
      
      const updatedUser = await this.userService.updateUser(currentUser.id, {
        nombre: userData.nombre || currentUser.nombre,
        apellido: userData.apellido || currentUser.apellido,
        email: userData.email || currentUser.email || '',
        dni: '', // Mantener DNI existente
        rol: currentUser.rol,
        direccion: userData.direccion,
        ciudad: userData.ciudad,
        codigoPostal: userData.codigoPostal,
        telefono: userData.telefono,
        novedades: false, // Valor por defecto
        terminos: true // Valor por defecto
      }).toPromise();

      if (updatedUser) {
        this.setCurrentUser(updatedUser);
        console.log('✅ Perfil actualizado exitosamente');
        
        return {
          success: true,
          message: 'Perfil actualizado correctamente'
        };
      } else {
        throw new Error('No se pudo actualizar el usuario');
      }
      
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      return {
        success: false,
        message: 'Error actualizando el perfil'
      };
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const currentUser = this.currentUser;
    
    if (!currentUser || !currentUser.email) {
      return {
        success: false,
        message: 'No hay usuario autenticado'
      };
    }

    try {
      // Verificar contraseña actual
      const isValidPassword = await this.userService.verificarCredenciales(currentUser.email, currentPassword);
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'La contraseña actual es incorrecta'
        };
      }

      // Actualizar contraseña
      await this.userService.updateUser(currentUser.id, {
        password: newPassword,
        nombre: currentUser.nombre,
        apellido: currentUser.apellido,
        email: currentUser.email,
        dni: '', // Mantener DNI existente
        rol: currentUser.rol,
        novedades: false,
        terminos: true
      }).toPromise();

      console.log('✅ Contraseña cambiada exitosamente');
      
      return {
        success: true,
        message: 'Contraseña cambiada correctamente'
      };
      
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      return {
        success: false,
        message: 'Error cambiando la contraseña'
      };
    }
  }

  /**
   * Refrescar datos del usuario actual
   */
  async refreshCurrentUser(): Promise<void> {
    const currentUser = this.currentUser;
    
    if (!currentUser) {
      return;
    }

    try {
      const refreshedUser = await this.userService.getUserById(currentUser.id).toPromise();
      
      if (refreshedUser) {
        this.setCurrentUser(refreshedUser);
        console.log('🔄 Usuario refrescado exitosamente');
      } else {
        console.log('⚠️ Usuario no encontrado al refrescar, cerrando sesión');
        await this.logout();
      }
    } catch (error) {
      console.error('❌ Error refrescando usuario:', error);
    }
  }

  /**
   * Verificar permisos de administrador
   */
  requireAdmin(): boolean {
    if (!this.isAuthenticated || !this.isAdmin()) {
      console.warn('⚠️ Acceso denegado: se requieren permisos de administrador');
      return false;
    }
    return true;
  }

  /**
   * Verificar autenticación
   */
  requireAuth(): boolean {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Acceso denegado: se requiere autenticación');
      return false;
    }
    return true;
  }
}
