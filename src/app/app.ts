import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import Swal from 'sweetalert2';

// Importamos los componentes y servicios necesarios
import { Header } from './encabezado/header';
import { Footer } from './pie-pagina/footer';
import { Registro } from './auth/registro/registro';
import { UserSupabaseService } from './servicios/user-supabase.service';
import { ConfiguracionService } from './servicios/configuracion';
import { AuthSupabaseService } from './servicios/auth-supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Footer, MatDialogModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Final');

  // Inyección de servicios moderna con inject()
  private titleService = inject(Title);
  private configuracionService = inject(ConfiguracionService);
  private userSupabaseService = inject(UserSupabaseService);
  private authSupabaseService = inject(AuthSupabaseService);

  constructor(
    public dialog: MatDialog
  ) {
    // Creamos un efecto que reacciona a los cambios en la configuración.
    effect(() => {
      // Obtenemos el título desde la señal del servicio de configuración.
      const nuevoTitulo = this.configuracionService.configuracionSignal().titulo;
      // Actualizamos el título de la pestaña del navegador.
      this.titleService.setTitle(nuevoTitulo);
    });
  }

  /**
   * ngOnInit es un "hook" del ciclo de vida de Angular.
   * Se ejecuta una sola vez, cuando el componente se ha inicializado.
   * Es el lugar perfecto para nuestra lógica de arranque.
   */
  ngOnInit(): void {
    this.verificarYCrearAdmin();
  }

  /**
   * Comprueba si existen usuarios en Supabase.
   * Si no existe ninguno, crea un usuario administrador por defecto.
   */
  async verificarYCrearAdmin(): Promise<void> {
    try {
      console.log('🔍 Verificando usuarios existentes en Supabase...');
      
      // Verificar si hay usuarios en Supabase
      this.userSupabaseService.users$.subscribe(async (usuarios: any[]) => {
        console.log(`👤 Usuarios encontrados: ${usuarios.length}`);
        
        if (usuarios.length === 0) {
          console.log('👤 No hay usuarios. El APP_INITIALIZER se encargará de la redirección.');
          // Ya no creamos usuario automáticamente, el APP_INITIALIZER maneja esto
        } else {
          console.log('✅ La base de datos ya tiene usuarios. Sistema listo.');
          
          // TEMPORAL: Crear usuario de prueba si no existe
          // Descomenta la siguiente línea si necesitas un usuario de prueba
          // await this.userSupabaseService.crearUsuarioPrueba();
        }
      });

    } catch (error: any) {
      console.error('❌ Error al verificar usuarios:', error);
      
      await Swal.fire({
        icon: 'warning',
        title: '⚠️ Error de Conexión',
        text: 'No se pudo conectar con Supabase. Verifica la configuración.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });
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
