import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { CarritoService } from '../servicios/carrito';
import { TarjetaVirtualService } from '../servicios/tarjeta-virtual.service';
import { PagoVirtualService } from '../servicios/pago-virtual.service';
import { PedidosService } from '../servicios/pedidos.service';
import { getMercadoPagoCredentials, getMercadoPagoSettings } from '../config/mercadopago.config';
import { SolicitudCrearPago } from '../shared/models/tarjeta-virtual.model';
import { SolicitudCrearPedido } from '../shared/models/pedido.model';
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
  private tarjetaVirtualService = inject(TarjetaVirtualService);
  private pagoVirtualService = inject(PagoVirtualService);
  private pedidosService = inject(PedidosService);

  cargandoMP = signal(false);
  cargandoTarjetaVirtual = signal(false);
  tarjetaVirtual = signal<any>(null);
  mostrandoMetodosPago = signal(false);

  // --- ENVÍO GRATIS ---
  // Monto mínimo para envío gratis (estilo Mercado Libre)
  readonly MONTO_ENVIO_GRATIS = 5000;

  /**
   * Calcula cuánto falta para envío gratis
   */
  cantidadFaltaEnvioGratis = computed(() => {
    const total = this.carritoService.totalPrecio();
    const falta = this.MONTO_ENVIO_GRATIS - total;
    return falta > 0 ? falta : 0;
  });

  /**
   * Porcentaje de progreso para envío gratis (0-100)
   */
  porcentajeEnvioGratis = computed(() => {
    const total = this.carritoService.totalPrecio();
    const porcentaje = (total / this.MONTO_ENVIO_GRATIS) * 100;
    return Math.min(porcentaje, 100);
  });

  /**
   * Indica si ya alcanzó el monto para envío gratis
   */
  tieneEnvioGratis = computed(() => {
    return this.carritoService.totalPrecio() >= this.MONTO_ENVIO_GRATIS;
  });

  /**
   * Muestra las opciones de pago disponibles
   */
  async mostrarOpcionesPago(): Promise<void> {
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

    // Cargar tarjeta virtual del usuario
    await this.cargarTarjetaVirtual(currentUser.id!);
    
    // Mostrar opciones de pago
    this.mostrandoMetodosPago.set(true);
  }

  /**
   * Carga la tarjeta virtual del usuario
   */
  private async cargarTarjetaVirtual(usuarioId: string): Promise<void> {
    try {
      const tarjeta = await this.tarjetaVirtualService.obtenerTarjetaPorUsuario(usuarioId);
      this.tarjetaVirtual.set(tarjeta);
    } catch (error) {
      console.error('Error al cargar tarjeta virtual:', error);
      this.tarjetaVirtual.set(null);
    }
  }

  /**
   * Inicia el proceso de pago con Mercado Pago
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
   * Procesa el pago con tarjeta virtual
   */
  async pagarConTarjetaVirtual(): Promise<void> {
    const currentUser = this.authService.currentUserSignal();
    const tarjeta = this.tarjetaVirtual();
    const items = this.carritoService.items();
    
    if (!currentUser || !tarjeta || items.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pueden procesar los datos del pago'
      });
      return;
    }

    // Validar saldo suficiente
    const total = this.carritoService.totalPrecio();
    if (tarjeta.saldo < total) {
      Swal.fire({
        icon: 'warning',
        title: 'Saldo Insuficiente',
        html: `
          <p>Tu tarjeta virtual no tiene saldo suficiente para esta compra.</p>
          <p><strong>Saldo disponible:</strong> $${tarjeta.saldo.toLocaleString('es-AR')}</p>
          <p><strong>Total a pagar:</strong> $${total.toLocaleString('es-AR')}</p>
          <p><small>Contacta al administrador para recargar tu tarjeta.</small></p>
        `
      });
      return;
    }

    // Validar estado de la tarjeta
    if (tarjeta.estado !== 'activa') {
      Swal.fire({
        icon: 'error',
        title: 'Tarjeta No Disponible',
        text: `Tu tarjeta virtual está ${tarjeta.estado}. Contacta al administrador.`
      });
      return;
    }

    this.cargandoTarjetaVirtual.set(true);

    try {
      // Preparar datos del pago
      const descripcionPago = `Compra de ${items.length} producto(s) - Carrito`;
      const solicitudPago: SolicitudCrearPago = {
        tarjetaId: tarjeta.id!,
        monto: total,
        descripcion: descripcionPago,
        referenciaExterna: `CARRITO-${Date.now()}`,
        detalleProducto: {
          nombre: items.length === 1 ? items[0].producto.nombre : `${items.length} productos`,
          categoria: 'Compra Online',
          cantidad: items.reduce((sum, item) => sum + item.cantidad, 0),
          precioUnitario: total / items.reduce((sum, item) => sum + item.cantidad, 0)
        },
        claveIdempotencia: `carrito-${currentUser.id}-${Date.now()}`
      };

      // 1. Crear intento de pago
      const resultadoCreacion = await this.pagoVirtualService.crearIntentoPago(solicitudPago, currentUser.id!);
      
      if (!resultadoCreacion.exito || !resultadoCreacion.pago?.id) {
        throw new Error(resultadoCreacion.mensaje);
      }

      const pagoId = resultadoCreacion.pago.id;

      // 2. Autorizar pago
      const resultadoAutorizacion = await this.pagoVirtualService.autorizarPago(pagoId, currentUser.id!);
      
      if (!resultadoAutorizacion.exito) {
        throw new Error(resultadoAutorizacion.mensaje);
      }

      // 3. Confirmar pago
      const resultadoConfirmacion = await this.pagoVirtualService.confirmarPago(pagoId, currentUser.id!);
      
      if (!resultadoConfirmacion.exito) {
        throw new Error(resultadoConfirmacion.mensaje);
      }

      // Pago exitoso - crear pedido
      await this.crearPedidoYProcesarPago(items, currentUser, total, pagoId);

    } catch (error) {
      console.error('❌ Error al procesar pago con tarjeta virtual:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error en el Pago',
        text: error instanceof Error ? error.message : 'Error desconocido al procesar el pago'
      });
    } finally {
      this.cargandoTarjetaVirtual.set(false);
    }
  }

  /**
   * Crea un pedido real después del pago exitoso
   */
  private async crearPedidoYProcesarPago(items: any[], usuario: any, total: number, pagoId?: string): Promise<void> {
    try {
      console.log('🛒 Creando pedido después del pago exitoso...');
      
      // Preparar datos del pedido
      const solicitudPedido: SolicitudCrearPedido = {
        items: items.map(item => ({
          productoId: item.producto.id || `prod-${Date.now()}`,
          nombre: item.producto.nombre,
          descripcion: item.producto.descripcion || '',
          imagen: item.producto.imagen,
          precioUnitario: item.producto.precio,
          cantidad: item.cantidad
        })),
        envio: {
          direccion: usuario.direccion || 'Dirección no especificada',
          ciudad: usuario.ciudad || 'Ciudad no especificada',
          codigoPostal: usuario.codigoPostal || '0000',
          provincia: 'Buenos Aires',
          pais: 'Argentina',
          metodoEnvio: 'Envío estándar'
        },
        metodoPago: 'tarjeta_virtual',
        notas: `Pedido creado desde carrito - Pago ID: ${pagoId}`
      };
      
      // Crear el pedido
      const resultadoPedido = await this.pedidosService.crearPedido(solicitudPedido, usuario.id);
      
      if (resultadoPedido.exito && resultadoPedido.pedido) {
        console.log('✅ Pedido creado exitosamente:', resultadoPedido.pedido.numeroPedido);
        
        // Procesar pago del pedido (esto actualizará el estado)
        const resultadoProcesarPago = await this.pedidosService.procesarPagoPedido(
          resultadoPedido.pedido.id!,
          usuario.id
        );
        
        if (resultadoProcesarPago.exito) {
          console.log('✅ Pago del pedido procesado exitosamente');
        }
        
        // Mostrar éxito y redirigir
        this.procesarPagoExitoso(items, usuario, total, pagoId, resultadoPedido.pedido.numeroPedido);
      } else {
        console.warn('⚠️ No se pudo crear el pedido, pero el pago fue exitoso');
        this.procesarPagoExitoso(items, usuario, total, pagoId);
      }
      
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      // Aunque falle la creación del pedido, el pago fue exitoso
      this.procesarPagoExitoso(items, usuario, total, pagoId);
    }
  }

  /**
   * Procesa un pago exitoso (común para ambos métodos)
   */
  private procesarPagoExitoso(items: any[], usuario: any, total: number, pagoId?: string, numeroPedido?: string): void {
    // Vaciar el carrito
    this.carritoService.vaciarCarrito();
    
    // Ocultar métodos de pago
    this.mostrandoMetodosPago.set(false);

    // Mostrar confirmación
    Swal.fire({
      icon: 'success',
      title: '¡Pago Exitoso!',
      html: `
        <div class="text-start">
          <p><strong>✅ Compra procesada correctamente</strong></p>
          ${numeroPedido ? `<p>Número de Pedido: <strong>${numeroPedido}</strong></p>` : ''}
          <p>Total pagado: <strong>$${total.toLocaleString('es-AR')}</strong></p>
          <p>Cliente: <strong>${usuario.nombre} ${usuario.apellido}</strong></p>
          <p>Productos: <strong>${items.length} items</strong></p>
          ${pagoId ? `<p>ID de Pago: <strong>${pagoId}</strong></p>` : ''}
          <hr>
          <p class="text-muted small">🎉 ¡Gracias por tu compra!</p>
          ${numeroPedido ? `<p class="text-info small">📦 Puedes ver el estado de tu pedido en "Mis Pedidos"</p>` : ''}
        </div>
      `,
      confirmButtonText: '¡Genial!',
      confirmButtonColor: '#28a745'
    });
  }

  /**
   * Cancela la selección de método de pago
   */
  cancelarPago(): void {
    this.mostrandoMetodosPago.set(false);
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
