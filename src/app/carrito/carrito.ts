import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { getMercadoPagoCredentials, getMercadoPagoSettings } from '../config/mercadopago.config';
import { PedidosFirestoreService } from '../servicios/pedidos-firestore.service';
import Swal from 'sweetalert2';

// Interfaces para el carrito
interface ProductoCarrito {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
}

interface ItemCarrito {
  producto: ProductoCarrito;
  cantidad: number;
}

// Servicio de carrito simplificado
class CarritoService {
  private _items = signal<ItemCarrito[]>([]);
  
  items = this._items.asReadonly();
  
  totalPrecio = computed(() => {
    return this._items().reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  });

  eliminarProducto(idProducto: string): void {
    this._items.update(items => items.filter(item => item.producto.id !== idProducto));
  }

  vaciarCarrito(): void {
    this._items.set([]);
  }

  agregarProducto(producto: ProductoCarrito, cantidad: number = 1): void {
    this._items.update(items => {
      const existente = items.find(item => item.producto.id === producto.id);
      if (existente) {
        existente.cantidad += cantidad;
        return [...items];
      } else {
        return [...items, { producto, cantidad }];
      }
    });
  }
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.html',
  providers: [CarritoService]
})
export class Carrito {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected carritoService = inject(CarritoService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private pedidosFirestore = inject(PedidosFirestoreService);

  cargandoMP = signal(false);

  /**
   * Inicia el proceso de pago, verificando primero la autenticación del usuario.
   */
  async pagarConMercadoPago(): Promise<void> {
    const currentUser = this.authService.currentUserSignal();
    
    if (!currentUser) {
      // Si no ha iniciado sesión, mostrar alerta
      const result = await Swal.fire({
        title: 'Iniciar Sesión Requerido',
        text: '¿Deseas iniciar sesión para continuar con la compra?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Iniciar Sesión',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        this.router.navigate(['/auth']);
      }
      return;
    }

    // Usuario autenticado - proceder al pago
    await this.procesarPago();
  }

  /**
   * Procesa el pago con Mercado Pago
   */
  private async procesarPago(): Promise<void> {
    const items = this.carritoService.items();
    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito Vacío',
        text: 'Agrega productos al carrito antes de proceder al pago.'
      });
      return;
    }

    const usuario = this.authService.currentUserSignal();
    if (!usuario) return;

    this.cargandoMP.set(true);

    try {
      // Crear pedido en Firestore primero
      const pedidoId = await this.pedidosFirestore.crearPedido(
        items,
        usuario,
        'local', // método de entrega por defecto
        'pref_' + Date.now()
      );

      console.log('✅ Pedido creado en Firestore:', pedidoId);

      // Proceder con Mercado Pago
      await this.crearPreferenciaMercadoPago(items, usuario);

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      this.cargandoMP.set(false);
      this.mostrarErrorPago('Error al procesar el pago. Intenta nuevamente.');
    }
  }

  /**
   * Crea una preferencia de Mercado Pago
   */
  private async crearPreferenciaMercadoPago(items: ItemCarrito[], usuario: any): Promise<void> {
    const credentials = getMercadoPagoCredentials();
    const settings = getMercadoPagoSettings();
    
    // Verificar credenciales
    if (credentials.ACCESS_TOKEN.includes('1234567890')) {
      this.cargandoMP.set(false);
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Modo Simulación',
        text: 'Mercado Pago no está configurado. ¿Deseas simular el pago?',
        showCancelButton: true,
        confirmButtonText: 'Simular Pago',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        this.simularPagoExitoso(items, usuario);
      }
      return;
    }

    // Preparar items para Mercado Pago
    const mpItems = items.map(item => ({
      title: item.producto.nombre.substring(0, 256),
      quantity: item.cantidad,
      unit_price: item.producto.precio
    }));

    const preference = {
      items: mpItems,
      back_urls: {
        success: `${window.location.origin}/pago-exitoso`,
        failure: `${window.location.origin}/pago-fallido`,
        pending: `${window.location.origin}/pago-pendiente`
      },
      auto_return: 'approved'
    };

    const headers = {
      'Authorization': `Bearer ${credentials.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('💳 Creando preferencia de Mercado Pago...');

    this.http.post('https://api.mercadopago.com/checkout/preferences', preference, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Preferencia creada:', response);
          this.cargandoMP.set(false);
          
          const paymentUrl = settings.USE_SANDBOX 
            ? response.sandbox_init_point 
            : response.init_point;
          
          if (paymentUrl) {
            window.location.href = paymentUrl;
          } else {
            this.mostrarErrorPago('No se pudo obtener el enlace de pago');
          }
        },
        error: (error: any) => {
          console.error('❌ Error creando preferencia:', error);
          this.cargandoMP.set(false);
          
          let mensaje = 'Error al conectar con Mercado Pago';
          if (error.status === 401) {
            mensaje = 'Credenciales de Mercado Pago inválidas';
          } else if (error.status === 400) {
            mensaje = 'Datos de pago inválidos';
          }
          
          this.mostrarErrorPago(mensaje);
        }
      });
  }

  /**
   * Simula un pago exitoso para desarrollo
   */
  private simularPagoExitoso(items: ItemCarrito[], usuario: any): void {
    const totalPagado = this.carritoService.totalPrecio();
    
    console.log('✅ Simulando pago exitoso:', {
      items: items.length,
      usuario: usuario.email,
      total: totalPagado
    });

    // Vaciar el carrito
    this.carritoService.vaciarCarrito();

    // Mostrar confirmación
    Swal.fire({
      icon: 'success',
      title: '¡Pago Simulado Exitoso!',
      html: `
        <div class="text-start">
          <p><strong>✅ Compra procesada correctamente</strong></p>
          <p>Total pagado: <strong>$${totalPagado.toLocaleString('es-AR')}</strong></p>
          <p>Cliente: <strong>${usuario.nombre} ${usuario.apellido}</strong></p>
          <p>Productos: <strong>${items.length} items</strong></p>
          <hr>
          <p class="text-muted small">🚧 Esta es una simulación para desarrollo.</p>
        </div>
      `,
      confirmButtonText: '¡Genial!',
      confirmButtonColor: '#28a745'
    });
  }

  /**
   * Muestra error de pago
   */
  private mostrarErrorPago(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error en el Pago',
      text: mensaje,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }

  // --- Métodos auxiliares ---
  cerrar(): void {
    // Método para cerrar el carrito (si se usa en modal)
    console.log('Cerrando carrito');
  }

  manejarEliminar(idProducto: string | undefined): void {
    if (idProducto) {
      this.carritoService.eliminarProducto(idProducto);
    }
  }

  manejarVaciar(): void {
    this.carritoService.vaciarCarrito();
  }

  /**
   * Maneja el error cuando una imagen no se puede cargar.
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-md">
          <i class="bi bi-box-seam text-2xl text-blue-600 opacity-40"></i>
        </div>
      `;
    }
  }
}
