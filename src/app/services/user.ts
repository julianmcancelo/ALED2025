import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  limit,
  collectionData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private usersCollection = collection(this.firestore, 'users');

  /**
   * Obtiene todos los usuarios de la base de datos como un stream.
   * @returns Un Observable que emite un array de usuarios cada vez que hay cambios.
   */
  getUsers(): Observable<any[]> {
    // collectionData nos da un observable que se actualiza en tiempo real.
    // El segundo argumento { idField: 'id' } es para asegurar que el ID
    // del documento se incluya en los datos del objeto.
    return collectionData(this.usersCollection, { idField: 'id' });
  }

  /**
   * Añade un nuevo usuario a la colección 'users'.
   * @param user - El objeto de usuario a añadir.
   */
  addUser(user: any) {
    return addDoc(this.usersCollection, user);
  }

  /**
   * Crea el primer usuario administrador en la base de datos.
   * @param user - Los datos del usuario (nombre, email, contraseña).
   */
  createAdminUser(user: any) {
    const userWithRole = { ...user, rol: 'admin' };
    return this.addUser(userWithRole);
  }

  /**
   * Verifica si ya existe algún usuario en la base de datos.
   * @returns Una promesa que se resuelve a 'true' si existen usuarios, 'false' si no.
   */
  async checkIfUsersExist(): Promise<boolean> {
    const userCollectionRef = collection(this.firestore, 'users');
    const q = query(userCollectionRef, limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Obtiene los datos de un usuario de Firestore a partir de su email.
   * @param email - El email del usuario a buscar.
   * @returns Una promesa que se resuelve con los datos del usuario o null si no se encuentra.
   */
  async getUserByEmail(email: string): Promise<any | null> {
    const userCollectionRef = collection(this.firestore, 'users');
    const q = query(userCollectionRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }
    // Devuelve los datos del primer documento encontrado incluyendo el ID.
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  /**
   * Verifica si un DNI o correo electrónico ya existen en la base de datos.
   * @param dni - El DNI a verificar.
   * @param email - El correo electrónico a verificar.
   * @returns Una promesa que se resuelve a 'false' si alguno ya existe, 'true' si son únicos.
   */
  async verificarUsuarioUnico(dni: string, email: string): Promise<boolean> {
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
  }
}
