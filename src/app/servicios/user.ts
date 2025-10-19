import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  limit,
  collectionData,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  enableNetwork,
  disableNetwork,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppUser } from '../auth/auth';

/**
 * Interfaz para los datos de usuario que se envían al crear/actualizar
 */
export interface UserData {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password?: string; // Opcional para actualizaciones
  rol: 'admin' | 'usuario';
  novedades: boolean;
  terminos: boolean;
  // Campos opcionales para dirección
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Obtiene todos los usuarios de la base de datos como un stream.
   */
  getUsers(): Observable<AppUser[]> {
    return runInInjectionContext(this.injector, () => {
      const usersCollection = collection(this.firestore, 'users');
      return collectionData(usersCollection, { idField: 'id' }) as Observable<AppUser[]>;
    });
  }

  /**
   * Añade un nuevo usuario a la colección 'users'.
   */
  addUser(user: Partial<UserData>) {
    return runInInjectionContext(this.injector, () => {
      const usersCollection = collection(this.firestore, 'users');
      return addDoc(usersCollection, user);
    });
  }

  /**
   * Actualiza los datos de un usuario existente en Firestore.
   * @param id - El ID del documento del usuario a actualizar.
   * @param data - Un objeto parcial con los campos y nuevos valores a modificar.
   * @returns Una promesa que se resuelve cuando la actualización se completa.
   */
  updateUser(id: string, data: Partial<UserData>): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const userDocRef = doc(this.firestore, `users/${id}`);
      return updateDoc(userDocRef, data);
    });
  }

  /**
   * Elimina un usuario de Firestore.
   * @param id - El ID del documento del usuario a eliminar.
   * @returns Una promesa que se resuelve cuando la eliminación se completa.
   */
  deleteUser(id: string): Promise<void> {
    return runInInjectionContext(this.injector, () => {
      const userDocRef = doc(this.firestore, `users/${id}`);
      return deleteDoc(userDocRef);
    });
  }

  /**
   * Obtiene los datos completos de un usuario específico por su ID.
   * @param id - El ID del documento del usuario a obtener.
   * @returns Una promesa que se resuelve con los datos del usuario (incluyendo el ID), o null si no se encuentra.
   */
  async getUserById(id: string): Promise<AppUser | null> {
    return runInInjectionContext(this.injector, async () => {
      const userDocRef = doc(this.firestore, `users/${id}`);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppUser;
      }
      return null;
    });
  }

  /**
   * Crea el primer usuario administrador en la base de datos.
   * @param user - Los datos del usuario (nombre, email, contraseña).
   */
  createAdminUser(user: Partial<UserData>) {
    const userWithRole = { ...user, rol: 'admin' as const };
    return this.addUser(userWithRole);
  }

  /**
   * Verifica si ya existe algún usuario en la base de datos.
   * @returns Una promesa que se resuelve a 'true' si existen usuarios, 'false' si no.
   */
  async checkIfUsersExist(): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log('🔍 Verificando existencia de usuarios en colección "users"...');
        
        const userCollectionRef = collection(this.firestore, 'users');
        console.log('📁 Referencia a colección "users" creada');
        
        const q = query(userCollectionRef, limit(1));
        console.log('🔍 Ejecutando consulta con límite 1...');
        
        const snapshot = await getDocs(q);
        const hasUsers = !snapshot.empty;
        
        console.log('📊 Resultado de la consulta:', {
          vacia: snapshot.empty,
          tamaño: snapshot.size,
          hayUsuarios: hasUsers,
          documentos: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
        });
        
        return hasUsers;
      } catch (error) {
        console.error('❌ Error al verificar usuarios en Firestore:', error);
        console.error('❌ Detalles del error:', {
          mensaje: error instanceof Error ? error.message : 'Error desconocido',
          codigo: (error as any)?.code,
          stack: error instanceof Error ? error.stack : 'No stack disponible'
        });
        
        // En caso de error, asumir que no hay usuarios para permitir configuración inicial
        return false;
      }
    });
  }

  /**
   * Obtiene los datos de un usuario de Firestore a partir de su email.
   * @param email - El email del usuario a buscar.
   * @returns Una promesa que se resuelve con los datos del usuario o null si no se encuentra.
   */
  async getUserByEmail(email: string): Promise<AppUser | null> {
    return runInInjectionContext(this.injector, async () => {
      const userCollectionRef = collection(this.firestore, 'users');
      const q = query(userCollectionRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }
      // Devuelve los datos del primer documento encontrado incluyendo el ID.
      const docSnapshot = querySnapshot.docs[0];
      return { id: docSnapshot.id, ...docSnapshot.data() } as AppUser;
    });
  }

  /**
   * Verifica si un DNI o correo electrónico ya existen en la base de datos.
   * @param dni - El DNI a verificar.
   * @param email - El correo electrónico a verificar.
   * @returns Una promesa que se resuelve a 'false' si alguno ya existe, 'true' si son únicos.
   */
  async verificarUsuarioUnico(dni: string, email: string): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      const userCollectionRef = collection(this.firestore, 'users');

      // 1. Consulta para verificar si el DNI ya existe.
      const qDni = query(userCollectionRef, where('dni', '==', dni));
      const dniSnapshot = await getDocs(qDni);
      if (!dniSnapshot.empty) {
        console.error('Error: El DNI ya está registrado.');
        return false; // El DNI no es único.
      }

      // 2. Consulta para verificar si el email ya existe.
      const qEmail = query(userCollectionRef, where('email', '==', email));
      const emailSnapshot = await getDocs(qEmail);
      if (!emailSnapshot.empty) {
        console.error('Error: El correo electrónico ya está registrado.');
        return false; // El email no es único.
      }

      // 3. Si ambas consultas no encontraron nada, el usuario es único.
      return true;
    });
  }

  /**
   * Verifica si un correo electrónico ya existe en la base de datos.
   * @param email - El correo electrónico a verificar.
   * @returns Una promesa que se resuelve a 'true' si el email ya existe, 'false' si es único.
   */
  async verificarEmailExiste(email: string): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      const userCollectionRef = collection(this.firestore, 'users');
      const qEmail = query(userCollectionRef, where('email', '==', email));
      const emailSnapshot = await getDocs(qEmail);
      return !emailSnapshot.empty; // Retorna true si el email ya existe
    });
  }

  /**
   * Verifica si un DNI ya existe en la base de datos.
   * @param dni - El DNI a verificar.
   * @returns Una promesa que se resuelve a 'true' si el DNI ya existe, 'false' si es único.
   */
  async verificarDniExiste(dni: string): Promise<boolean> {
    return runInInjectionContext(this.injector, async () => {
      const userCollectionRef = collection(this.firestore, 'users');
      const qDni = query(userCollectionRef, where('dni', '==', dni));
      const dniSnapshot = await getDocs(qDni);
      return !dniSnapshot.empty; // Retorna true si el DNI ya existe
    });
  }

  /**
   * Método de prueba para verificar la conexión con Firestore
   * Intenta listar todas las colecciones disponibles
   */
  async probarConexionFirestore(): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        console.log('🔥 Probando conexión con Firestore...');
        console.log('🔥 Configuración Firebase:', {
          projectId: this.firestore.app.options.projectId,
          authDomain: this.firestore.app.options.authDomain,
          firestoreInstance: this.firestore.constructor.name
        });
        
        // Reiniciar conexión de red por si hay problemas
        try {
          await disableNetwork(this.firestore);
          await enableNetwork(this.firestore);
          console.log('🔄 Red de Firestore reiniciada');
        } catch (networkError) {
          console.warn('⚠️ No se pudo reiniciar la red:', networkError);
        }
        
        // Intentar obtener todas las colecciones
        const userCollectionRef = collection(this.firestore, 'users');
        console.log('📁 Intentando acceder a colección "users"...');
        
        // Consulta simple para verificar acceso
        const snapshot = await getDocs(query(userCollectionRef, limit(5)));
        
        console.log('✅ Conexión exitosa con Firestore!');
        console.log('📊 Información de la colección "users":', {
          existe: true,
          documentos: snapshot.size,
          vacia: snapshot.empty,
          datos: snapshot.docs.map(doc => ({
            id: doc.id,
            email: doc.data()['email'] || 'Sin email',
            nombre: doc.data()['nombre'] || 'Sin nombre',
            rol: doc.data()['rol'] || 'Sin rol'
          }))
        });
        
      } catch (error) {
        console.error('❌ Error de conexión con Firestore:', error);
        console.error('❌ Tipo de error:', error instanceof Error ? error.constructor.name : typeof error);
        
        if (error instanceof Error) {
          console.error('❌ Mensaje:', error.message);
          console.error('❌ Stack:', error.stack);
        }
        
        // Verificar si es un error de permisos
        if ((error as any)?.code === 'permission-denied') {
          console.error('🚫 Error de permisos: Verifica las reglas de Firestore');
          console.log('🛠️ Reglas sugeridas para desarrollo:');
          console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`);
        }
        
        throw error;
      }
    });
  }
}
