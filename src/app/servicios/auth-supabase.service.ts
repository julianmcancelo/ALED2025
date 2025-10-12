import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { supabase, SupabaseUsuario, TABLES } from '../config/supabase.config';

/**
 * SERVICIO DE AUTENTICACIÓN CON SUPABASE PARA ALED2025
 * ====================================================
 * 
 * Servicio de autenticación migrado de Firebase a Supabase
 * Mantiene la misma interfaz para compatibilidad
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

// Importar la interfaz unificada desde auth.ts
import { AppUser } from '../auth/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthSupabaseService {
  
  // 👤 ESTADO DE USUARIO
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    console.log('🔐 Inicializando AuthSupabaseService...');
    this.initializeAuthState();
  }

  // 🚀 INICIALIZACIÓN

  /**
   * Inicializa el estado de autenticación
   */
  private async initializeAuthState(): Promise<void> {
    try {
      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Cambio de autenticación:', event);
        
        if (session?.user) {
          await this.loadUserProfile(session.user.id);
        } else {
          this.clearUserState();
        }
      });
    } catch (error) {
      console.error('❌ Error inicializando estado de auth:', error);
      this.clearUserState();
    }
  }

  /**
   * Carga el perfil completo del usuario
   */
  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USUARIOS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error cargando perfil:', error);
        return;
      }

      const user: AppUser = {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        activo: data.activo
      };

      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      console.log('✅ Perfil de usuario cargado:', user.email);
    } catch (error) {
      console.error('❌ Error cargando perfil de usuario:', error);
      this.clearUserState();
    }
  }

  /**
   * Limpia el estado del usuario
   */
  private clearUserState(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  // 🔑 MÉTODOS DE AUTENTICACIÓN

  /**
   * Inicia sesión con email y contraseña
   */
  login(email: string, password: string): Observable<AppUser> {
    console.log('🔑 Iniciando sesión para:', email);
    
    return from(supabase.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error en login:', error);
          throw new Error(this.getAuthErrorMessage(error.message));
        }
        
        if (!data.user) {
          throw new Error('No se pudo obtener información del usuario');
        }
        
        console.log('✅ Login exitoso para:', email);
        
        // Convertir User de Supabase a AppUser
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email || '',
          nombre: data.user.user_metadata?.['nombre'] || data.user.email?.split('@')[0] || '',
          rol: data.user.user_metadata?.['rol'] || 'cliente',
          activo: true
        };
        
        return appUser;
      }),
      catchError((error) => {
        console.error('❌ Error en login:', error);
        throw error;
      })
    );
  }

  /**
   * Registra un nuevo usuario
   */
  register(userData: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
  }): Observable<any> {
    console.log('📝 Registrando usuario:', userData.email);
    
    return from(supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido
        }
      }
    })).pipe(
      tap(async ({ data, error }) => {
        if (error) {
          console.error('❌ Error en registro:', error);
          throw new Error(this.getAuthErrorMessage(error.message));
        }

        // Crear perfil de usuario en la tabla usuarios
        if (data.user) {
          try {
            await supabase.from(TABLES.USUARIOS).insert({
              id: data.user.id,
              email: userData.email,
              nombre: userData.nombre,
              apellido: userData.apellido,
              rol: 'cliente',
              activo: true
            });
            console.log('✅ Perfil de usuario creado');
          } catch (profileError) {
            console.error('❌ Error creando perfil:', profileError);
          }
        }
      }),
      map(({ data, error }) => {
        if (error) throw error;
        console.log('✅ Registro exitoso para:', userData.email);
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error en registro:', error);
        throw error;
      })
    );
  }

  /**
   * Cierra la sesión actual
   */
  logout(): Observable<boolean> {
    console.log('🚪 Cerrando sesión...');
    
    return from(supabase.auth.signOut()).pipe(
      map(({ error }) => {
        if (error) {
          console.error('❌ Error cerrando sesión:', error);
          throw error;
        }
        
        this.clearUserState();
        this.router.navigate(['/']);
        console.log('✅ Sesión cerrada exitosamente');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error en logout:', error);
        throw error;
      })
    );
  }

  /**
   * Restablece la contraseña
   */
  resetPassword(email: string): Observable<boolean> {
    console.log('🔄 Restableciendo contraseña para:', email);
    
    return from(supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })).pipe(
      map(({ error }) => {
        if (error) {
          console.error('❌ Error restableciendo contraseña:', error);
          throw new Error(this.getAuthErrorMessage(error.message));
        }
        
        console.log('✅ Email de restablecimiento enviado');
        return true;
      }),
      catchError((error) => {
        console.error('❌ Error en reset password:', error);
        throw error;
      })
    );
  }

  // 👤 MÉTODOS DE USUARIO

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Verifica si el usuario actual es administrador
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'admin' || false;
  }

  /**
   * Verifica si el usuario actual es cliente
   */
  isCliente(): boolean {
    const user = this.getCurrentUser();
    return user?.rol === 'cliente' || false;
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(profileData: Partial<SupabaseUsuario>): Observable<AppUser> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    console.log('✏️ Actualizando perfil de:', user.email);
    
    return from(supabase
      .from(TABLES.USUARIOS)
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error actualizando perfil:', error);
          throw error;
        }
        
        const updatedUser: AppUser = {
          id: data.id,
          email: data.email,
          nombre: data.nombre,
          apellido: data.apellido,
          rol: data.rol,
          activo: data.activo
        };
        
        this.currentUserSubject.next(updatedUser);
        console.log('✅ Perfil actualizado exitosamente');
        return updatedUser;
      }),
      catchError((error) => {
        console.error('❌ Error actualizando perfil:', error);
        throw error;
      })
    );
  }

  // 🛡️ MÉTODOS DE UTILIDAD

  /**
   * Convierte errores de Supabase a mensajes amigables
   */
  private getAuthErrorMessage(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
      'Email not confirmed': 'Email no confirmado. Revisa tu bandeja de entrada.',
      'User already registered': 'Este email ya está registrado.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      'Invalid email': 'El formato del email no es válido.',
      'Signup is disabled': 'El registro está deshabilitado temporalmente.',
      'Email rate limit exceeded': 'Has excedido el límite de emails. Intenta más tarde.'
    };

    return errorMap[errorMessage] || `Error de autenticación: ${errorMessage}`;
  }

  /**
   * Verifica si el token de sesión es válido
   */
  async isTokenValid(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.access_token;
    } catch {
      return false;
    }
  }

  /**
   * Refresca el token de sesión
   */
  refreshToken(): Observable<boolean> {
    return from(supabase.auth.refreshSession()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return !!data.session;
      }),
      catchError((error) => {
        console.error('❌ Error refrescando token:', error);
        return from([false]);
      })
    );
  }
}
