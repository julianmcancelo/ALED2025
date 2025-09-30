import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router'; // Importamos RouterOutlet
import * as bcrypt from 'bcryptjs';

// Importamos los componentes y servicios necesarios
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { Registro } from './auth/registro/registro';
import { UserService } from './services/user';
import { Firestore, collection, getDocs, limit, query } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Footer, MatDialogModule, RouterOutlet], // Añadimos RouterOutlet
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Final');

  constructor(
    public dialog: MatDialog,
    private firestore: Firestore,
    private userService: UserService,
  ) {}

  /**
   * ngOnInit es un "hook" del ciclo de vida de Angular.
   * Se ejecuta una sola vez, cuando el componente se ha inicializado.
   * Es el lugar perfecto para nuestra lógica de arranque.
   */
  ngOnInit(): void {
    this.verificarYCrearAdmin();
  }

  /**
   * Comprueba si existen usuarios en la base de datos.
   * Si no existe ninguno, crea un usuario administrador por defecto.
   */
  async verificarYCrearAdmin(): Promise<void> {
    const userCollectionRef = collection(this.firestore, 'users');
    // Creamos una consulta que solo pida 1 documento para ser más eficiente.
    const q = query(userCollectionRef, limit(1));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // La colección está vacía, no hay usuarios.
      console.log('No se encontraron usuarios. Creando administrador por defecto...');

      // Hasheamos la contraseña por defecto.
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('admin123', salt);

      const adminUser = {
        nombre: 'Admin',
        apellido: 'Principal',
        dni: '00000000',
        email: 'admin@admin.com',
        password: hashedPassword,
        rol: 'admin', // Asignamos el rol de administrador
        novedades: false,
        terminos: true,
      };

      try {
        await this.userService.addUser(adminUser);
        console.log('Usuario administrador creado con éxito.');
        console.log('Email: admin@admin.com');
        console.log('Contraseña: admin123');
      } catch (error) {
        console.error('Error al crear el usuario administrador:', error);
      }
    } else {
      // La colección ya tiene usuarios.
      console.log('La base de datos ya tiene usuarios. No se requiere ninguna acción.');
    }
  }

  /**
   * Abre el diálogo modal de registro.
   */
  openRegisterDialog(): void {
    this.dialog.open(Registro, {
      width: '550px',
    });
  }
}
