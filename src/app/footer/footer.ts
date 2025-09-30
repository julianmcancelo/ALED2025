import { Component } from '@angular/core';
// Importamos MatToolbarModule para poder usar <mat-toolbar> en la plantilla.
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Componente encargado de mostrar el pie de página de la aplicación.
 * Contiene información sobre el proyecto, los desarrolladores y el profesor.
 * Es un componente 'standalone', gestionando sus propias dependencias.
 */
@Component({
  selector: 'app-footer', // Selector para usar este componente: <app-footer></app-footer>
  imports: [
    MatToolbarModule, // Importa el módulo necesario para la barra de herramientas.
  ],
  templateUrl: './footer.html', // Plantilla HTML del componente.
  styleUrl: './footer.css', // Hoja de estilos del componente.
})
export class Footer {}
