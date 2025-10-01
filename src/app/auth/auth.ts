import { Injectable, inject, signal } from '@angular/core';
import { UserService } from '../services/user';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { Unsubscribe } from 'firebase/firestore';

// Definimos una interfaz para nuestro objeto de usuario.
export interface AppUser {
  id: string;
  email: string | null;
  nombre: string;
  apellido: string; // Apellido del usuario
  rol: 'admin' | 'usuario';
  // Campos opcionales para la dirección de entrega
  domicilio?: string;
  ciudad?: string;
  codigoPostal?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private userService: UserService = inject(UserService);
  private router: Router = inject(Router);
  private firestore: Firestore = inject(Firestore);

  private readonly USER_STORAGE_KEY = 'app_user_session';
  private userSubscription: Unsubscribe | null = null;

  currentUserSignal = signal<AppUser | null | undefined>(undefined);

  constructor() {
    this.cargarSesionDesdeStorage();
  }

  private cargarSesionDesdeStorage(): void {
    try {
      const userDataString = localStorage.getItem(this.USER_STORAGE_KEY);
      if (userDataString) {
        const appUser: AppUser = JSON.parse(userDataString);
        this.currentUserSignal.set(appUser);
        // Si cargamos un usuario, empezamos a escuchar sus cambios en tiempo real.
        this.listenToCurrentUser(appUser.id); // Usar 'id'
      } else {
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      console.error('Error al cargar la sesión desde localStorage:', error);
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Se suscribe a los cambios del documento del usuario actual en Firestore.
   * @param userId - El ID del usuario a escuchar.
   */
  private listenToCurrentUser(userId: string): void {
    if (this.userSubscription) {
      this.userSubscription();
    }

    const userDocRef = doc(this.firestore, 'users', userId);
    this.userSubscription = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const updatedUser = { id: snapshot.id, ...snapshot.data() } as AppUser; // Usar 'id'
        this.currentUserSignal.set(updatedUser);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } else {
        this.logout();
      }
    });
  }

  async login(email: string, password: string): Promise<void> {
    const userProfile = await this.userService.getUserByEmail(email);
    if (!userProfile) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const passwordIsValid = bcrypt.compareSync(password, userProfile.password);
    if (!passwordIsValid) {
      throw new Error('El correo electrónico o la contraseña son incorrectos.');
    }

    const appUser: AppUser = {
      id: userProfile.id, // Usar 'id' en lugar de 'uid'
      email: userProfile.email,
      ...userProfile,
    };

    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(appUser));
    this.currentUserSignal.set(appUser);

    this.listenToCurrentUser(appUser.id); // Usar 'id'

    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    // Al cerrar sesión, cancelamos la suscripción a los cambios.
    if (this.userSubscription) {
      this.userSubscription();
      this.userSubscription = null;
    }

    localStorage.removeItem(this.USER_STORAGE_KEY);
    this.currentUserSignal.set(null);
    this.router.navigate(['/']);
  }
}
