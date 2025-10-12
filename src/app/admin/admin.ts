import { Component, effect, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, Sidebar, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements AfterViewInit {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    console.log('🏗️ Componente Admin inicializado');
    console.log('👤 Usuario actual:', this.authService.currentUserSignal());
    console.log('📋 Importaciones del componente:', {
      CommonModule: !!CommonModule,
      Sidebar: !!Sidebar,
      RouterOutlet: !!RouterOutlet
    });
    
    // --- EFECTO DE SEGURIDAD EN TIEMPO REAL ---
    // Este 'effect' se ejecutará cada vez que la señal del usuario cambie.
    effect(() => {
      const user = this.authService.currentUserSignal();
      console.log('🔄 Admin Effect - Usuario actual:', user);
      
      // Si el usuario ya no es 'admin' (o es nulo), lo expulsamos.
      if (user?.rol !== 'admin') {
        console.log('❌ Privilegios de administrador revocados. Redirigiendo a inicio...');
        this.router.navigate(['/']);
      } else {
        console.log('✅ Usuario admin verificado, manteniendo acceso');
      }
    });
  }

  ngAfterViewInit() {
    console.log('🔍 Admin ngAfterViewInit - Verificando DOM...');
    const sidebarElement = document.querySelector('app-sidebar');
    const adminLayout = document.querySelector('.admin-layout');
    console.log('📋 Elementos encontrados:', {
      sidebar: !!sidebarElement,
      adminLayout: !!adminLayout,
      sidebarHTML: sidebarElement?.innerHTML?.substring(0, 100) || 'No encontrado'
    });
  }
}
