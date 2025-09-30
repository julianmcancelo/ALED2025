import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private firestore: Firestore) {}

  /**
   * Añade un nuevo usuario a la colección 'users' en Firestore.
   */
  addUser(user: any) {
    const userCollectionRef = collection(this.firestore, 'users');
    return addDoc(userCollectionRef, user);
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
