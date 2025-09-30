import { Component, signal } from '@angular/core';
// Importamos los componentes Header y Footer para poder utilizarlos en la plantilla HTML.
import { Header } from './header/header';
import { Footer } from './footer/footer';

/**
 * Este es el componente raíz (principal) de la aplicación.
 * Es el primer componente que se carga y actúa como contenedor de todos los demás.
 */
@Component({
  selector: 'app-root', // El selector que se usa en index.html para cargar este componente.
  imports: [Header, Footer], // Declara que este componente utiliza los componentes Header y Footer.
  templateUrl: './app.html', // La plantilla HTML asociada.
  styleUrl: './app.css', // La hoja de estilos asociada.
})
export class App {
  // 'signal' es una nueva característica de Angular para manejar el estado de forma reactiva.
  // Aquí, simplemente almacena el título de la aplicación.
  protected readonly title = signal('Final');
}
