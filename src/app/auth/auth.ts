import { Injectable, signal } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import * as bcrypt from 'bcryptjs';

/**
 * Servicio para gestionar la autenticación de usuarios y el estado de la sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // 'currentUserSignal' es un 'signal' de Angular que almacena el estado del usuario actual.
  // Es reactivo: si su valor cambia, cualquier parte de la app que lo observe se actualizará.
  // Inicialmente es 'null' porque no hay nadie conectado.
  currentUserSignal = signal<any | null>(null);

  constructor(private firestore: Firestore) {}

  /**
   * Inicia sesión de un usuario comparando sus credenciales con los datos en Firestore.
   * @param email - El correo electrónico del usuario.
   * @param password - La contraseña en texto plano introducida por el usuario.
   * @returns Una promesa que se resuelve a 'true' si el inicio de sesión es exitoso, 'false' si no.
   */
  async login(email: string, password: string): Promise<boolean> {
    // 1. Creamos una referencia a la colección 'users'.
    const userCollectionRef = collection(this.firestore, 'users');

    // 2. Creamos una consulta para buscar un documento cuyo campo 'email' coincida.
    const q = query(userCollectionRef, where('email', '==', email));

    // 3. Ejecutamos la consulta.
    const querySnapshot = await getDocs(q);

    // 4. Verificamos si se encontró un usuario.
    if (querySnapshot.empty) {
      console.log('No se encontró ningún usuario con ese email.');
      return false;
    }

    // 5. Obtenemos los datos del primer usuario encontrado (el email debería ser único).
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const hashedPassword = userData['password']; // La contraseña hasheada de la base de datos.

    // 6. Comparamos la contraseña introducida con la hasheada usando bcrypt.
    const passwordMatches = bcrypt.compareSync(password, hashedPassword);

    if (passwordMatches) {
      console.log('Inicio de sesión exitoso para:', userData['nombre']);
      // Si las contraseñas coinciden, actualizamos el signal con los datos del usuario.
      // Esto notificará a toda la aplicación que el usuario ha iniciado sesión.
      this.currentUserSignal.set(userData);
      return true;
    } else {
      console.log('La contraseña es incorrecta.');
      return false;
    }
  }

  /**
   * Cierra la sesión del usuario actual.
   */
  logout(): void {
    // Simplemente establecemos el signal del usuario a 'null'.
    // Esto notificará a la aplicación que la sesión se ha cerrado.
    this.currentUserSignal.set(null);
    console.log('Sesión cerrada.');
  }
}
