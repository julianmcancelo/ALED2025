import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @component WelcomeAdmin
 * Muestra un mensaje de bienvenida en el panel de administración.
 */
@Component({
  selector: 'app-welcome-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class WelcomeAdmin {}
