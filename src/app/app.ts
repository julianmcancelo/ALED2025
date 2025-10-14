import { Component, OnInit, signal, effect, inject, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';

// Importamos los componentes y servicios necesarios
import { Header } from './encabezado/header';
import { Footer } from './pie-pagina/footer';
import { Registro } from './auth/registro/registro';
import { UserService } from './servicios/user';
import { ConfiguracionService } from './servicios/configuracion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Footer, MatDialogModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Final');

  // Inyectamos los servicios necesarios
  private userService = inject(UserService);
  private configuracionService = inject(ConfiguracionService);
  private titleService = inject(Title);
  private injector = inject(Injector);
  private dialog = inject(MatDialog);

  constructor() {
    // Creamos un efecto que reacciona a los cambios en la configuración.
    effect(() => {
      const nuevoTitulo = this.configuracionService.configuracionSignal().titulo;
      // Actualizamos el título de la pestaña del navegador.
      this.titleService.setTitle(nuevoTitulo);
    });
  }

  /**
   * ngOnInit es un "hook" del ciclo de vida de Angular.
   * Se ejecuta una sola vez, cuando el componente se ha inicializado.
   * La lógica del primer usuario se maneja en APP_INITIALIZER.
   */
  ngOnInit(): void {
    // La verificación del primer usuario se maneja en app.config.ts
    // Inicialización silenciosa
  }

  /**
   * Método de debugging para verificar el estado de usuarios (solo para desarrollo).
   * Ya no crea usuarios automáticamente - eso se maneja en /primer-usuario
   */
  async verificarEstadoUsuarios(): Promise<void> {
    // Método disponible solo para debugging manual
    // No se ejecuta automáticamente
    await runInInjectionContext(this.injector, async () => {
      try {
        const usersExist = await this.userService.checkIfUsersExist();
        console.log('🔍 [DEBUG] Estado de usuarios en Firebase:', {
          existenUsuarios: usersExist,
          coleccion: 'usuarios',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ [DEBUG] Error al verificar usuarios:', error);
      }
    });
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
