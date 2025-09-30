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
   * Inicia sesión usando el servicio de autenticación de Firebase.
   */
  async login(email: string, password: string): Promise<void> {
    // Usamos el método de Firebase para iniciar sesión.
    // onAuthStateChanged se encargará del resto si tiene éxito.
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Cierra la sesión del usuario actual en Firebase.
   */
  async logout(): Promise<void> {
    // Usamos el método de Firebase para cerrar sesión.
    // onAuthStateChanged se encargará de actualizar el signal a 'null'.
    await signOut(this.auth);
    // Opcional: redirigir al usuario a la página de inicio.
    this.router.navigate(['/']);
  }
}
