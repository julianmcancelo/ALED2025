import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

// Importamos el sidebar, que es parte fija del layout.
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterOutlet], // Añadimos RouterOutlet
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  // La lógica principal ahora reside en los componentes hijos cargados por el router.
}
