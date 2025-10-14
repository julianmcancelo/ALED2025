import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { CarritoService } from '../servicios/carrito';
import { getMercadoPagoCredentials, getMercadoPagoSettings } from '../config/mercadopago.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.html'
})
export class Carrito {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected carritoService = inject(CarritoService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

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
      // Convertir items del carrito al formato esperado por Firestore
      const itemsFirestore = items.map(item => ({
        producto: {
          id: item.producto.id || '',
          nombre: item.producto.nombre,
          precio: item.producto.precio,
          imagen: item.producto.imagen
        },
        cantidad: item.cantidad
      }));

      // Proceder directamente con Mercado Pago
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
  private async crearPreferenciaMercadoPago(items: any[], usuario: any): Promise<void> {
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
    const mpItems = items.map(item => {
      const precio = parseFloat(item.producto.precio.toString()) || 1; // Mínimo $1
      const cantidad = parseInt(item.cantidad.toString()) || 1;
      
      return {
        title: (item.producto.nombre || 'Producto').substring(0, 256),
        quantity: cantidad,
        unit_price: precio >= 1 ? precio : 1, // Asegurar precio mínimo
        currency_id: 'ARS'
      };
    });
    
    console.log('📦 Items preparados para MP:', mpItems);
    
    // Validar que todos los items tengan precios válidos
    const itemsInvalidos = mpItems.filter(item => item.unit_price <= 0 || item.quantity <= 0);
    if (itemsInvalidos.length > 0) {
      console.error('❌ Items con precios inválidos:', itemsInvalidos);
      this.cargandoMP.set(false);
      this.mostrarErrorPago('Error: Algunos productos tienen precios inválidos');
      return;
    }

    // Obtener la URL base correcta
    let baseUrl = window.location.origin;
    
    // Si estamos en localhost, usar una URL de prueba válida para Mercado Pago
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = 'https://aled2025-5be25.web.app'; // URL de producción
      console.log('🌐 Usando URL de producción para MP:', baseUrl);
    } else {
      console.log('🌐 URL base detectada:', baseUrl);
    }
    
    // Configuración mínima y básica de Mercado Pago
    const preference = {
      items: mpItems,
      back_urls: {
        success: `${baseUrl}/pago-exitoso`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`
      }
    };

    const headers = {
      'Authorization': `Bearer ${credentials.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('💳 Creando preferencia de Mercado Pago...');
    console.log('📋 Preferencia a enviar:', JSON.stringify(preference, null, 2));
    console.log('🔑 Headers:', headers);

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
          console.error('❌ Detalles del error:', error.error);
          this.cargandoMP.set(false);
          
          let mensaje = 'Error al conectar con Mercado Pago';
          if (error.status === 401) {
            mensaje = 'Credenciales de Mercado Pago inválidas';
          } else if (error.status === 400) {
            if (error.error?.message) {
              mensaje = `Error de configuración: ${error.error.message}`;
            } else {
              mensaje = 'Datos de pago inválidos. Revisa la configuración.';
            }
          }
          
          this.mostrarErrorPago(mensaje);
        }
      });
  }

  /**
   * Simula un pago exitoso para desarrollo
   */
  private simularPagoExitoso(items: any[], usuario: any): void {
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
  
  // --- Método de prueba temporal ---
  probarCarrito(): void {
    console.log('🧪 Probando carrito...');
    this.carritoService.agregarProductosDePrueba();
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
