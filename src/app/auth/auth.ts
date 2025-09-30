import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { UserService } from '../services/user';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';

// Definimos una interfaz para nuestro objeto de usuario, incluyendo el rol.
export interface AppUser {
  uid: string;
  email: string | null;
  nombre: string;
  rol: 'admin' | 'usuario'; // O los roles que tengas
  // ... otros campos de tu colección de usuarios
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inyectamos los servicios necesarios con 'inject()'.
  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  private router: Router = inject(Router);

  // El signal ahora contendrá un objeto 'AppUser', 'null' (desconectado)
  // o 'undefined' (estado inicial, comprobando...).
  currentUserSignal = signal<AppUser | null | undefined>(undefined);

  constructor() {
    // onAuthStateChanged es el hook de Firebase que se dispara cuando el
    // estado de autenticación cambia. Es la clave para la persistencia.
    onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Si Firebase nos dice que hay un usuario, buscamos su perfil en Firestore.
        const userProfile = await this.userService.getUserByEmail(firebaseUser.email!);
        if (userProfile) {
          // Creamos nuestro objeto AppUser con los datos de ambos sitios.
          const appUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userProfile, // Copiamos los campos de Firestore (nombre, rol, etc.)
          };
          // Actualizamos el signal. La app ahora sabe quién está conectado.
          this.currentUserSignal.set(appUser);
        } else {
          // Caso raro: autenticado en Firebase pero sin perfil en Firestore.
          this.currentUserSignal.set(null);
        }
      } else {
        // Si no hay usuario en Firebase, cerramos la sesión en nuestra app.
        this.currentUserSignal.set(null);
      }
    });
  }

  /**
   * Inicia sesión comparando la contraseña hasheada con bcrypt.
   */
  async login(email: string, password: string): Promise<void> {
    // 1. Buscar al usuario por su email en nuestra base de datos (Firestore).
    const userProfile = await this.userService.getUserByEmail(email);

    // Si no encontramos un usuario con ese email, lanzamos un error.
    if (!userProfile) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    // 2. Comparar la contraseña proporcionada con el hash almacenado.
    // bcrypt.compareSync devuelve 'true' si coinciden, 'false' si no.
    const passwordIsValid = bcrypt.compareSync(password, userProfile.password);

    // Si las contraseñas no coinciden, lanzamos el mismo error genérico.
    if (!passwordIsValid) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    // 3. Si la contraseña es válida, actualizamos nuestro signal de estado.
    // Creamos un objeto AppUser con los datos del perfil.
    // El 'uid' puede venir del perfil o ser un identificador único que tengas.
    const appUser: AppUser = {
      uid: userProfile.id, // Asumiendo que el perfil tiene un campo 'id'
      email: userProfile.email,
      ...userProfile,
    };

    this.currentUserSignal.set(appUser);

    // Opcional: Redirigir al usuario a la página principal tras el login.
    this.router.navigate(['/']);
  }

  /**
   * Cierra la sesión del usuario actual.
   */
  async logout(): Promise<void> {
    // Simplemente ponemos el signal a 'null' para cerrar la sesión en nuestra app.
    this.currentUserSignal.set(null);
    // Opcional: redirigir al usuario a la página de inicio.
    this.router.navigate(['/']);
  }
}
