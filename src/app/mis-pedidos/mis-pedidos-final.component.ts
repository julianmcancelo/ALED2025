import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth';
import { Router } from '@angular/router';
import { PedidosFirestoreService, PedidoMercadoPago } from '../servicios/pedidos-firestore.service';

interface PedidoSimple {
  id: string;
  estado: string;
  total: number;
  fechaCreacion: any;
  items: any[];
}

@Component({
  selector: 'app-mis-pedidos-final',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-pedidos-final.component.html',
  styleUrls: ['./mis-pedidos-final.component.css']
})
export class MisPedidosFinalComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private pedidosFirestore = inject(PedidosFirestoreService);

  pedidos = signal<PedidoSimple[]>([]);
  cargando = signal(false);

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    const user = this.authService.currentUserSignal();
    
    if (!user?.id) {
      this.router.navigate(['/auth']);
      return;
    }

    this.cargando.set(true);

    this.pedidosFirestore.obtenerPedidosUsuario(user.id).subscribe({
      next: (pedidos: PedidoMercadoPago[]) => {
        console.log('✅ Pedidos cargados:', pedidos.length);
        const pedidosSimples = pedidos.map(p => ({
          id: p.id,
          estado: p.estado,
          total: p.total,
          fechaCreacion: p.fechaCreacion,
          items: p.items
        }));
        this.pedidos.set(pedidosSimples);
        this.cargando.set(false);
      },
      error: (error: any) => {
        console.error('❌ Error:', error);
        this.pedidos.set([]);
        this.cargando.set(false);
      }
    });
  }

  async crearPedidosPrueba(): Promise<void> {
    const user = this.authService.currentUserSignal();
    if (!user) return;

    this.cargando.set(true);

    try {
      // Crear pedido de prueba
      await this.pedidosFirestore.crearPedido(
        [
          {
            producto: {
              id: '1',
              nombre: 'Producto de Prueba',
              precio: 1000,
              categoria: 'Test'
            },
            cantidad: 1
          }
        ],
        {
          id: user.id,
          email: user.email || '',
          nombre: user.nombre,
          apellido: user.apellido,
          telefono: user.telefono
        },
        'local',
        'pref_test_' + Date.now()
      );

      console.log('✅ Pedido de prueba creado');
      
      // Recargar pedidos
      setTimeout(() => {
        this.cargarPedidos();
      }, 1000);

    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      this.cargando.set(false);
    }
  }

  actualizarPedidos(): void {
    this.cargarPedidos();
  }

  obtenerIdCorto(id: string): string {
    return id.substring(0, 8);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    let date: Date;
    if (fecha.seconds) {
      date = new Date(fecha.seconds * 1000);
    } else if (fecha.toDate) {
      date = fecha.toDate();
    } else {
      date = new Date(fecha);
    }
    
    return date.toLocaleDateString('es-AR');
  }
}
