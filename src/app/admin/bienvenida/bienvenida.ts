import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @component BienvenidaAdmin
 * Muestra un mensaje de bienvenida en el panel de administración.
 */
@Component({
  selector: 'app-bienvenida-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
})
export class BienvenidaAdmin {}
