/**
 * SERVICIO DE USUARIOS CON SUPABASE PARA ALED2025
 * ===============================================
 * 
 * Servicio migrado de Firebase a Supabase para gestión de usuarios
 * Mantiene compatibilidad con la interfaz existente
 * 
 * DESARROLLADO POR: Cancelo Julian & Nicolas Otero
 * INSTITUTO: Instituto Beltrán
 * MATERIA: ALED III - T.A.S.
 */

import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { supabase, SupabaseUsuario, TABLES } from '../config/supabase.config';
import { AppUser } from '../auth/auth';
import * as bcrypt from 'bcryptjs';

/**
 * Interfaz para los datos de usuario que se envían al crear/actualizar
 */
export interface UserData {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password?: string; // Opcional para actualizaciones
  rol: 'admin' | 'cliente';
  // Campos opcionales para dirección
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  telefono?: string;
  // Nota: novedades y terminos no se almacenan en la tabla actual
  novedades?: boolean;
  terminos?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserSupabaseService {
  
  private usersSubject = new BehaviorSubject<AppUser[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor() {
    console.log('👤 Inicializando UserSupabaseService...');
    this.suscribirCambiosUsuarios();
  }

  /**
   * Suscribirse a cambios en tiempo real de usuarios
   */
  private suscribirCambiosUsuarios(): void {
    supabase
      .channel('usuarios_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.USUARIOS },
        () => {
          console.log('🔄 Cambio detectado en usuarios, recargando...');
          this.cargarUsuarios();
        }
      )
      .subscribe();

    // Cargar usuarios inicialmente
    this.cargarUsuarios();
  }

  /**
   * Cargar usuarios desde Supabase
   */
  private async cargarUsuarios(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USUARIOS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error cargando usuarios:', error);
        return;
      }

      const usuarios: AppUser[] = data.map(this.mapearUsuarioSupabase);
      this.usersSubject.next(usuarios);
      console.log(`✅ ${usuarios.length} usuarios cargados desde Supabase`);
    } catch (error) {
      console.error('❌ Error inesperado cargando usuarios:', error);
    }
  }

  /**
   * Mapear usuario de Supabase a AppUser
   */
  private mapearUsuarioSupabase(usuario: SupabaseUsuario): AppUser {
    return {
      id: usuario.id!,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol === 'usuario' ? 'cliente' : usuario.rol as 'admin' | 'cliente',
      activo: usuario.activo ?? true,
      direccion: usuario.direccion || undefined,
      ciudad: usuario.ciudad || undefined,
      codigoPostal: usuario.codigo_postal || undefined,
      telefono: usuario.telefono || undefined,
      // Campo legacy para compatibilidad
      domicilio: usuario.direccion || undefined
    };
  }

  /**
   * Mapear AppUser a formato Supabase
   */
  private mapearUsuarioASupabase(userData: UserData): Omit<SupabaseUsuario, 'id' | 'created_at' | 'updated_at'> {
    return {
      email: userData.email,
      nombre: userData.nombre,
      apellido: userData.apellido,
      dni: userData.dni,
      rol: userData.rol === 'cliente' ? 'usuario' : userData.rol,
      password_hash: userData.password ? bcrypt.hashSync(userData.password, 10) : undefined,
      direccion: userData.direccion || undefined,
      ciudad: userData.ciudad || undefined,
      codigo_postal: userData.codigoPostal || undefined,
      telefono: userData.telefono || undefined,
      activo: true
      // Nota: acepta_novedades y acepta_terminos no existen en la tabla real de Supabase
      // Estos campos están disponibles en UserData pero no se persisten en la base de datos
    };
  }

  /**
   * Obtiene todos los usuarios como Observable
   */
  getUsers(): Observable<AppUser[]> {
    return this.users$;
  }

  /**
   * Crear un nuevo usuario
   */
  createUser(userData: UserData): Observable<AppUser> {
    console.log('👤 Creando usuario:', userData.email);
    
    const usuarioSupabase = this.mapearUsuarioASupabase(userData);
    
    return from(supabase
      .from(TABLES.USUARIOS)
      .insert(usuarioSupabase)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error creando usuario:', error);
          throw new Error(`Error creando usuario: ${error.message}`);
        }
        
        const nuevoUsuario = this.mapearUsuarioSupabase(data);
        console.log('✅ Usuario creado exitosamente:', nuevoUsuario.email);
        return nuevoUsuario;
      }),
      catchError(error => {
        console.error('❌ Error en createUser:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar un usuario existente
   */
  updateUser(userId: string, userData: Partial<UserData>): Observable<AppUser> {
    console.log('👤 Actualizando usuario:', userId);
    
    const datosActualizacion: Partial<SupabaseUsuario> = {};
    
    if (userData.nombre) datosActualizacion.nombre = userData.nombre;
    if (userData.apellido) datosActualizacion.apellido = userData.apellido;
    if (userData.email) datosActualizacion.email = userData.email;
    if (userData.dni) datosActualizacion.dni = userData.dni;
    if (userData.rol) datosActualizacion.rol = userData.rol === 'cliente' ? 'usuario' : userData.rol;
    if (userData.direccion !== undefined) datosActualizacion.direccion = userData.direccion;
    if (userData.ciudad !== undefined) datosActualizacion.ciudad = userData.ciudad;
    if (userData.codigoPostal !== undefined) datosActualizacion.codigo_postal = userData.codigoPostal;
    if (userData.telefono !== undefined) datosActualizacion.telefono = userData.telefono;
    if (userData.password) datosActualizacion.password_hash = bcrypt.hashSync(userData.password, 10);
    
    return from(supabase
      .from(TABLES.USUARIOS)
      .update(datosActualizacion)
      .eq('id', userId)
      .select()
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('❌ Error actualizando usuario:', error);
          throw new Error(`Error actualizando usuario: ${error.message}`);
        }
        
        const usuarioActualizado = this.mapearUsuarioSupabase(data);
        console.log('✅ Usuario actualizado exitosamente:', usuarioActualizado.email);
        return usuarioActualizado;
      }),
      catchError(error => {
        console.error('❌ Error en updateUser:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar un usuario
   */
  deleteUser(userId: string): Observable<boolean> {
    console.log('👤 Eliminando usuario:', userId);
    
    return from(supabase
      .from(TABLES.USUARIOS)
      .delete()
      .eq('id', userId)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('❌ Error eliminando usuario:', error);
          throw new Error(`Error eliminando usuario: ${error.message}`);
        }
        
        console.log('✅ Usuario eliminado exitosamente');
        return true;
      }),
      catchError(error => {
        console.error('❌ Error en deleteUser:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener un usuario por ID
   */
  getUserById(userId: string): Observable<AppUser | null> {
    return from(supabase
      .from(TABLES.USUARIOS)
      .select('*')
      .eq('id', userId)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return null; // Usuario no encontrado
          }
          console.error('❌ Error obteniendo usuario:', error);
          throw new Error(`Error obteniendo usuario: ${error.message}`);
        }
        
        return this.mapearUsuarioSupabase(data);
      }),
      catchError(error => {
        console.error('❌ Error en getUserById:', error);
        return from([null]);
      })
    );
  }

  /**
   * Buscar usuario por email
   */
  getUserByEmail(email: string): Observable<AppUser | null> {
    return from(supabase
      .from(TABLES.USUARIOS)
      .select('*')
      .eq('email', email)
      .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return null; // Usuario no encontrado
          }
          console.error('❌ Error buscando usuario por email:', error);
          throw new Error(`Error buscando usuario: ${error.message}`);
        }
        
        return this.mapearUsuarioSupabase(data);
      }),
      catchError(error => {
        console.error('❌ Error en getUserByEmail:', error);
        return from([null]);
      })
    );
  }

  /**
   * Verificar si existen usuarios en el sistema
   */
  async checkIfUsersExist(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USUARIOS)
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Error verificando usuarios:', error);
        return false;
      }

      const existenUsuarios = data && data.length > 0;
      console.log(`🔍 Usuarios existentes: ${existenUsuarios ? 'Sí' : 'No'}`);
      return existenUsuarios;
    } catch (error) {
      console.error('❌ Error inesperado verificando usuarios:', error);
      return false;
    }
  }

  /**
   * Verificar credenciales de usuario
   */
  async verificarCredenciales(email: string, password: string): Promise<AppUser | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USUARIOS)
        .select('*')
        .eq('email', email)
        .eq('activo', true)
        .single();

      if (error || !data) {
        console.log('❌ Usuario no encontrado:', email);
        return null;
      }

      // Verificar contraseña
      const passwordValida = bcrypt.compareSync(password, data.password_hash || '');
      
      if (!passwordValida) {
        console.log('❌ Contraseña incorrecta para:', email);
        return null;
      }

      console.log('✅ Credenciales válidas para:', email);
      return this.mapearUsuarioSupabase(data);
    } catch (error) {
      console.error('❌ Error verificando credenciales:', error);
      return null;
    }
  }

  /**
   * MÉTODO TEMPORAL: Crear usuario de prueba con contraseña conocida
   */
  async crearUsuarioPrueba(): Promise<void> {
    try {
      const usuarioPrueba = {
        nombre: 'Admin',
        apellido: 'Prueba',
        email: 'admin@test.com',
        password: '123456',
        dni: '12345678',
        rol: 'admin' as const,
        novedades: false,
        terminos: true
      };

      await this.createUser(usuarioPrueba).toPromise();
      console.log('✅ Usuario de prueba creado: admin@test.com / 123456');
    } catch (error) {
      console.error('❌ Error al crear usuario de prueba:', error);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async obtenerEstadisticas(): Promise<{
    total: number;
    admins: number;
    usuarios: number;
    activos: number;
  }> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USUARIOS)
        .select('rol, activo');

      if (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        return { total: 0, admins: 0, usuarios: 0, activos: 0 };
      }

      const stats = {
        total: data.length,
        admins: data.filter(u => u.rol === 'admin').length,
        usuarios: data.filter(u => u.rol === 'usuario').length,
        activos: data.filter(u => u.activo).length
      };

      console.log('📊 Estadísticas de usuarios:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      return { total: 0, admins: 0, usuarios: 0, activos: 0 };
    }
  }
}
