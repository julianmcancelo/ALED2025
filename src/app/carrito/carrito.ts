import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { getMercadoPagoCredentials, getMercadoPagoSettings } from '../config/mercadopago.config';
import { PedidosFirestoreService } from '../servicios/pedidos-firestore.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carrito.html',
})
export class Carrito {
  // --- INYECCIÓN DE DEPENDENCIAS ---
  protected carritoService = inject(CarritoService);
  protected activeOffcanvas = inject(NgbActiveOffcanvas);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private pedidosFirestore = inject(PedidosFirestoreService);

  cargandoMP = signal(false);

  /**
   * Inicia el proceso de pago, verificando primero la autenticación del usuario.
   */
  async pagarConMercadoPago(): Promise<void> {
    const currentUser = this.authService.currentUserSignal();
    
    if (!currentUser) {
      // Si no ha iniciado sesión, mostramos el modal de autenticación
      this.activeOffcanvas.dismiss('Authentication required');
      this.openAuthRequiredModal();
      return;
    }

    // Usuario autenticado - verificar datos de envío y método de entrega
    await this.verificarDatosYMetodoEntrega();
  }

  /**
   * Abre el modal que pregunta al usuario si quiere iniciar sesión o registrarse.
   */
  private openAuthRequiredModal(): void {
    const dialogRef = this.dialog.open(AuthRequeridoComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'login') {
        this.openLoginModal();
      } else if (result === 'register') {
        this.openRegisterModal();
      }
    });
  }

  /**
   * Abre el modal de inicio de sesión y gestiona la continuación del pago.
   */
  private openLoginModal(): void {
    const dialogRef = this.dialog.open(InicioDeSesion);
    this.handleAuthModalClose(dialogRef);
  }

  /**
   * Abre el modal de registro y gestiona la continuación del pago.
   */
  private openRegisterModal(): void {
    const dialogRef = this.dialog.open(Registro);
    this.handleAuthModalClose(dialogRef);
  }

  /**
   * Se suscribe al cierre de un modal de autenticación (login/registro).
   * Si el usuario se autenticó, reanuda el pago.
   * @param dialogRef - La referencia al diálogo que se abrió.
   */
  private handleAuthModalClose(dialogRef: any): void {
    dialogRef.afterClosed().subscribe(async () => {
      if (this.authService.currentUserSignal()) {
        await this.verificarDatosYMetodoEntrega();
      }
    });
  }

  // --- Otros métodos del componente ---
  cerrar(): void {
    this.activeOffcanvas.dismiss('Cross click');
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
          <i class="bi bi-box-seam text-2xl text-[#0077b6] opacity-40"></i>
        </div>
      `;
    }
  }

  /**
   * Verifica los datos de envío y permite seleccionar el método de entrega.
   */
  private async verificarDatosYMetodoEntrega(): Promise<void> {
    const currentUser = this.authService.currentUserSignal();
    if (!currentUser?.id) return;

    // Obtener datos del usuario desde Firestore
    const userData = await this.userService.getUserById(currentUser.id);

    // Verificar si tiene datos de envío
    const tieneDatosEnvio = userData?.direccion && userData?.ciudad && userData?.codigoPostal;

    // Mostrar modal para seleccionar método de entrega
    const result = await Swal.fire({
      title: 'Método de Entrega',
      html: `
        <div class="text-left space-y-4">
          <p class="text-gray-700 mb-4">Selecciona cómo deseas recibir tu pedido:</p>
          <div class="space-y-3">
            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#0077b6] transition-colors">
              <input type="radio" name="metodoEntrega" value="envio" class="mr-3 w-4 h-4 text-[#0077b6]">
              <div class="flex-1">
                <div class="font-semibold text-gray-900">Envío a domicilio</div>
                <div class="text-sm text-gray-600">Recibe tu pedido en tu dirección</div>
                ${!tieneDatosEnvio ? '<div class="text-xs text-blue-600 mt-1 flex items-center"><i class="bi bi-info-circle mr-1"></i> Se solicitarán tus datos de envío</div>' : '<div class="text-xs text-green-600 mt-1 flex items-center"><i class="bi bi-check-circle mr-1"></i> Datos de envío completos</div>'}
              </div>
            </label>
            <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#0077b6] transition-colors">
              <input type="radio" name="metodoEntrega" value="local" class="mr-3 w-4 h-4 text-[#0077b6]" checked>
              <div class="flex-1">
                <div class="font-semibold text-gray-900">Retiro en local</div>
                <div class="text-sm text-gray-600">Retira tu pedido en nuestro local</div>
              </div>
            </label>
          </div>
          ${!tieneDatosEnvio ? '<div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"><p class="text-sm text-blue-800"><i class="bi bi-lightbulb mr-1"></i> <strong>Nota:</strong> Si eliges envío a domicilio, podrás completar tus datos en el siguiente paso.</p></div>' : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0077b6',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold',
        htmlContainer: 'text-left'
      },
      preConfirm: () => {
        const selected = document.querySelector('input[name="metodoEntrega"]:checked') as HTMLInputElement;
        return selected?.value;
      }
    });

    if (result.isConfirmed && result.value) {
      if (result.value === 'envio') {
        if (!tieneDatosEnvio) {
          // Solicitar datos de envío
          await this.solicitarDatosEnvio();
        } else {
          // Preguntar si quiere usar los datos existentes o modificarlos
          const confirmarDatos = await Swal.fire({
            title: 'Confirmar Datos de Envío',
            html: `
              <div class="text-left space-y-3">
                <p class="text-gray-700 mb-3">Tus datos de envío actuales:</p>
                <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><strong>Dirección:</strong> ${userData?.direccion || 'N/A'}</p>
                  <p><strong>Ciudad:</strong> ${userData?.ciudad || 'N/A'}</p>
                  <p><strong>Código Postal:</strong> ${userData?.codigoPostal || 'N/A'}</p>
                  <p><strong>Teléfono:</strong> ${userData?.telefono || 'N/A'}</p>
                </div>
              </div>
            `,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Usar estos datos',
            denyButtonText: 'Modificar datos',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0077b6',
            denyButtonColor: '#6c757d',
          });

          if (confirmarDatos.isConfirmed) {
            // Usar datos existentes
            this._proceedToMercadoPago('envio');
          } else if (confirmarDatos.isDenied) {
            // Modificar datos
            await this.solicitarDatosEnvio();
          }
        }
      } else {
        // Proceder al pago con retiro en local
        this._proceedToMercadoPago(result.value);
      }
    }
  }

  /**
   * Solicita y guarda los datos de envío del usuario.
   */
  private async solicitarDatosEnvio(): Promise<void> {
    const result = await Swal.fire({
      title: 'Datos de Envío',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input id="direccion" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Calle y número">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input id="ciudad" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Ciudad">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
            <input id="codigoPostal" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Código Postal">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input id="telefono" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0077b6] focus:border-transparent" placeholder="Teléfono de contacto">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar y Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0077b6',
      customClass: {
        popup: 'rounded-xl',
        title: 'text-2xl font-bold'
      },
      preConfirm: () => {
        const direccion = (document.getElementById('direccion') as HTMLInputElement).value;
        const ciudad = (document.getElementById('ciudad') as HTMLInputElement).value;
        const codigoPostal = (document.getElementById('codigoPostal') as HTMLInputElement).value;
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value;

        if (!direccion || !ciudad || !codigoPostal || !telefono) {
          Swal.showValidationMessage('Por favor completa todos los campos');
          return false;
        }

        return { direccion, ciudad, codigoPostal, telefono };
      }
    });

    if (result.isConfirmed && result.value) {
      const currentUser = this.authService.currentUserSignal();
      if (currentUser?.id) {
        // Guardar datos en Firestore
        await this.userService.updateUser(currentUser.id, result.value);
        
        Swal.fire({
          icon: 'success',
          title: 'Datos guardados',
          text: 'Tus datos de envío han sido guardados correctamente',
          timer: 2000,
          showConfirmButton: false
        });

        // Proceder al pago con envío
        this._proceedToMercadoPago('envio');
      }
    }
  }

  /**
   * Contiene la lógica para contactar con el backend y redirigir a Mercado Pago.
   */
  private _proceedToMercadoPago(metodoEntrega: string = 'local'): void {
    const items = this.carritoService.items();
    if (items.length === 0) return;

    // Obtener información del usuario actual
    const usuario = this.authService.currentUserSignal();
    if (!usuario) {
      Swal.fire({
        icon: 'warning',
        title: 'Sesión requerida',
        text: 'Debes iniciar sesión para realizar una compra.',
        confirmButtonText: 'Iniciar Sesión'
      });
      return;
    }

    this.cargandoMP.set(true);
    this.activeOffcanvas.dismiss('Processing payment');

    // INTEGRACIÓN DIRECTA CON MERCADO PAGO
    console.log('💳 Procesando pago con Mercado Pago:', {
      items,
      usuario: usuario.email,
      total: this.carritoService.totalPrecio()
    });

    // Verificar si las credenciales están configuradas
    const credentials = getMercadoPagoCredentials();
    if (credentials.ACCESS_TOKEN.includes('1234567890')) {
      // Mostrar mensaje de configuración necesaria
      this.cargandoMP.set(false);
      Swal.fire({
        icon: 'warning',
        title: 'Configuración Requerida',
        html: `
          <div class="text-start">
            <p><strong>⚙️ Mercado Pago no está configurado</strong></p>
            <p>Para procesar pagos reales, necesitas:</p>
            <ol class="text-start">
              <li>Crear una cuenta en <a href="https://www.mercadopago.com.ar/developers" target="_blank">Mercado Pago Developers</a></li>
              <li>Obtener tus credenciales (Public Key y Access Token)</li>
              <li>Reemplazar las credenciales en <code>mercadopago.config.ts</code></li>
            </ol>
            <hr>
            <p class="text-muted small">Por ahora puedes usar el modo simulación para probar la funcionalidad.</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '🧪 Usar Simulación',
        cancelButtonText: '❌ Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545'
      }).then((result) => {
        if (result.isConfirmed) {
          // Usar simulación temporal
          this.simularPagoExitoso(items, usuario, metodoEntrega);
        }
      });
      return;
    }

    // Probar con preferencia ultra simple primero
    this.probarPreferenciaSimple(items, usuario, metodoEntrega);
  }

  /**
   * Prueba con una preferencia ultra simple
   */
  private probarPreferenciaSimple(items: any[], usuario: any, metodoEntrega: string): void {
    const credentials = getMercadoPagoCredentials();
    
    // Preferencia ultra básica - solo lo mínimo requerido
    const preference = {
      items: [
        {
          title: "Producto de prueba",
          quantity: 1,
          unit_price: 100
        }
      ]
    };

    const headers = {
      'Authorization': `Bearer ${credentials.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('🧪 Probando preferencia ultra simple:', {
      preference,
      headers: { Authorization: 'Bearer ***' },
      credentials_valid: credentials.ACCESS_TOKEN.length > 50
    });

    this.http.post('https://api.mercadopago.com/checkout/preferences', preference, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ ¡Preferencia simple funcionó!:', response);
          // Si funciona, intentar con los datos reales
          this.crearPreferenciaMercadoPago(items, usuario, metodoEntrega);
        },
        error: (error) => {
          console.error('❌ Error con preferencia simple:', error);
          console.error('❌ Respuesta del servidor:', error.error);
          
          this.cargandoMP.set(false);
          
          // Mostrar el error específico de Mercado Pago
          let mensajeError = 'Error de Mercado Pago';
          if (error.error?.message) {
            mensajeError = `Error: ${error.error.message}`;
          } else if (error.error?.cause) {
            mensajeError = `Error: ${JSON.stringify(error.error.cause)}`;
          }
          
          this.mostrarErrorPago(mensajeError);
        }
      });
  }

  /**
   * Crea una preferencia de Mercado Pago directamente
   */
  private crearPreferenciaMercadoPago(items: any[], usuario: any, metodoEntrega: string): void {
    const settings = getMercadoPagoSettings();
    const total = this.carritoService.totalPrecio();
    
    // Preparar items para Mercado Pago con validación
    const mpItems = items.map(item => ({
      title: item.producto.nombre.substring(0, 256), // Limitar título a 256 caracteres
      quantity: parseInt(item.cantidad.toString()),
      unit_price: parseFloat(item.producto.precio.toString()),
      currency_id: settings.PAYMENT.CURRENCY
    }));

    // Validar que todos los items tengan datos válidos
    const itemsValidos = mpItems.every(item => 
      item.title && 
      item.quantity > 0 && 
      item.unit_price > 0 && 
      !isNaN(item.quantity) && 
      !isNaN(item.unit_price)
    );

    if (!itemsValidos) {
      console.error('❌ Items inválidos para Mercado Pago:', mpItems);
      this.cargandoMP.set(false);
      this.mostrarErrorPago('Error: Productos con datos inválidos');
      return;
    }

    // Calcular costo de envío
    const shippingCost = metodoEntrega === 'domicilio' 
      ? (total >= settings.SHIPPING.FREE_SHIPPING_MIN ? 0 : settings.SHIPPING.COST_DOMICILIO)
      : 0;

    // Agregar envío como item si tiene costo
    if (shippingCost > 0) {
      mpItems.push({
        title: 'Envío a domicilio',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: settings.PAYMENT.CURRENCY
      });
    }

    // Configuración ultra básica de la preferencia (formato mínimo de Mercado Pago)
    const preference = {
      items: mpItems.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price
      }))
    };

    console.log('💳 Preferencia de Mercado Pago:', preference);
    // Crear preferencia usando API directa de Mercado Pago
    await this.crearPreferenciaDirecta(preference, items, usuario, metodoEntrega);
  }

  /**
   * Crea la preferencia usando la API directa de Mercado Pago
   */
  private async crearPreferenciaDirecta(preference: any, items?: any[], usuario?: any, metodoEntrega?: string): Promise<void> {
    const credentials = getMercadoPagoCredentials();
    const settings = getMercadoPagoSettings();
    
    const headers = {
      'Authorization': `Bearer ${credentials.ACCESS_TOKEN}`,
{{ ... }}
    };

    const apiUrl = settings.USE_SANDBOX 
      ? 'https://api.mercadopago.com/checkout/preferences'
      : 'https://api.mercadopago.com/checkout/preferences';

    console.log('🔗 Llamando a Mercado Pago API:', {
      url: apiUrl,
      sandbox: settings.USE_SANDBOX,
      items: preference.items.length,
      headers: headers,
      preference: preference
    });

    this.http.post(apiUrl, preference, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Preferencia creada exitosamente:', {
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point
          });
          
          this.cargandoMP.set(false);
          
          // Usar sandbox_init_point si estamos en modo sandbox
          const paymentUrl = settings.USE_SANDBOX 
            ? response.sandbox_init_point 
            : response.init_point;
          
          console.log('🔍 DEBUG MODO PAGO:', {
            USE_SANDBOX: settings.USE_SANDBOX,
            sandbox_url: response.sandbox_init_point,
            production_url: response.init_point,
            selected_url: paymentUrl,
            mode: settings.USE_SANDBOX ? 'SANDBOX' : 'PRODUCCIÓN'
          });
          
          if (paymentUrl) {
            console.log('🚀 Redirigiendo a Mercado Pago:', paymentUrl);
            window.location.href = paymentUrl;
          } else {
            this.mostrarErrorPago('No se pudo obtener el enlace de pago de Mercado Pago');
          }
        },
        error: (error) => {
          console.error('❌ Error creando preferencia de Mercado Pago:', error);
          console.error('❌ Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error,
            url: error.url
          });
          
          this.cargandoMP.set(false);
          
          let mensajeError = 'Error al conectar con Mercado Pago';
          
          if (error.status === 401) {
            mensajeError = 'Credenciales de Mercado Pago inválidas';
          } else if (error.status === 400) {
            mensajeError = `Datos de pago inválidos: ${error.error?.message || 'Formato incorrecto'}`;
            console.error('❌ Error 400 - Preferencia enviada:', preference);
          } else if (error.status === 0) {
            mensajeError = 'Error de conexión. Verifica tu internet';
          }
          
          this.mostrarErrorPago(mensajeError);
        }
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

  /**
   * Simula un pago exitoso para desarrollo
   */
  private simularPagoExitoso(items: any[], usuario: any, metodoEntrega: string): void {
    // Calcular total antes de vaciar el carrito
    const totalPagado = this.carritoService.totalPrecio();
    
    console.log('✅ Simulando pago exitoso:', {
      items,
      usuario: usuario.email,
      metodoEntrega,
      total: totalPagado
    });

    // Vaciar el carrito después del "pago"
    this.carritoService.vaciarCarrito();

    // Mostrar confirmación de pago exitoso
    Swal.fire({
      icon: 'success',
      title: '¡Pago Simulado Exitoso!',
      html: `
        <div class="text-start">
          <p><strong>✅ Compra procesada correctamente</strong></p>
          <p>Total pagado: <strong>$${totalPagado.toLocaleString('es-AR')}</strong></p>
          <p>Cliente: <strong>${usuario.nombre} ${usuario.apellido}</strong></p>
          <p>Email: <strong>${usuario.email}</strong></p>
          <p>Productos: <strong>${items.length} items</strong></p>
          <hr>
          <p class="text-muted small">🚧 Esta es una simulación para desarrollo. En producción se procesará con Mercado Pago real.</p>
        </div>
      `,
      confirmButtonText: '🎉 ¡Genial!',
      confirmButtonColor: '#28a745'
    }).then(() => {
      // Cerrar el offcanvas después de la confirmación
      this.activeOffcanvas.close('payment_success');
    });
  }
}
