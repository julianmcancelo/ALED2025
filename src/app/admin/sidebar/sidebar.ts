import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * @component Sidebar
 * Componente de navegación lateral para la sección de administración.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  constructor() {
    console.log('📋 Componente Sidebar inicializado');
  }
  
  // La lógica de navegación se maneja directamente en el template
  // con las directivas 'routerLink' y 'routerLinkActive'.
}
