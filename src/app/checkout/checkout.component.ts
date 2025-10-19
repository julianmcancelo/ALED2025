import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CarritoService } from '../servicios/carrito';
import { AuthService } from '../auth/auth';
import { ConfiguracionService } from '../servicios/configuracion';
import { TarjetaVirtualService } from '../servicios/tarjeta-virtual.service';
import { PagoVirtualService } from '../servicios/pago-virtual.service';
import { PedidosService } from '../servicios/pedidos.service';
import { getMercadoPagoCredentials, getMercadoPagoSettings } from '../config/mercadopago.config';
import { SolicitudCrearPago } from '../shared/models/tarjeta-virtual.model';
import { SolicitudCrearPedido } from '../shared/models/pedido.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  protected carritoService = inject(CarritoService);
  protected authService = inject(AuthService);
  protected configuracionService = inject(ConfiguracionService);
  private tarjetaVirtualService = inject(TarjetaVirtualService);
  private pagoVirtualService = inject(PagoVirtualService);
  private pedidosService = inject(PedidosService);
  private http = inject(HttpClient);
  private router = inject(Router);

  protected configuracion = this.configuracionService.configuracionSignal;
  protected currentUser = this.authService.currentUserSignal;
  
  protected tarjetaVirtual = signal<any>(null);
  protected cargandoTarjetaVirtual = signal(false);
  protected metodoPagoSeleccionado = signal<'tarjeta_virtual' | 'mercadopago' | null>(null);
  protected metodoEnvioSeleccionado = signal<'domicilio' | 'retiro' | null>(null);
  protected procesandoPago = signal(false);

  protected readonly MONTO_ENVIO_GRATIS = 5000;
  protected readonly COSTO_ENVIO_DOMICILIO = 1000;

  ngOnInit() {
    // Verificar autenticación
    if (!this.currentUser()) {
      Swal.fire({
        icon: 'warning',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para continuar con la compra',
        confirmButtonText: 'Ir a login'
      }).then(() => {
        this.router.navigate(['/']);
      });
      return;
    }

    // Verificar que haya items en el carrito
    if (this.carritoService.items().length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Carrito vacío',
        text: 'No tienes productos en el carrito',
        confirmButtonText: 'Ir a la tienda'
      }).then(() => {
        this.router.navigate(['/productos']);
      });
      return;
    }

    // Cargar tarjeta virtual
    this.cargarTarjetaVirtual();
  }

  async cargarTarjetaVirtual() {
    const user = this.currentUser();
    if (!user?.id) return;

    try {
      const tarjeta = await this.tarjetaVirtualService.obtenerTarjetaPorUsuario(user.id);
      this.tarjetaVirtual.set(tarjeta);
    } catch (error) {
      console.error('Error al cargar tarjeta:', error);
    }
  }

  protected tieneEnvioGratis = computed(() => {
    return this.carritoService.totalPrecio() >= this.MONTO_ENVIO_GRATIS;
  });

  protected costoEnvio = computed(() => {
    const metodoEnvio = this.metodoEnvioSeleccionado();
    
    // Retiro en local = gratis
    if (metodoEnvio === 'retiro') {
      return 0;
    }
    
    // Envío a domicilio
    if (metodoEnvio === 'domicilio') {
      return this.tieneEnvioGratis() ? 0 : this.COSTO_ENVIO_DOMICILIO;
    }
    
    // Si no seleccionó método, mostrar costo estimado
    return this.tieneEnvioGratis() ? 0 : this.COSTO_ENVIO_DOMICILIO;
  });

  protected totalFinal = computed(() => {
    return this.carritoService.totalPrecio() + this.costoEnvio();
  });

  protected seleccionarMetodoPago(metodo: 'tarjeta_virtual' | 'mercadopago') {
    this.metodoPagoSeleccionado.set(metodo);
  }

  protected seleccionarMetodoEnvio(metodo: 'domicilio' | 'retiro') {
    this.metodoEnvioSeleccionado.set(metodo);
  }

  protected async confirmarCompra() {
    const metodoPago = this.metodoPagoSeleccionado();
    const metodoEnvio = this.metodoEnvioSeleccionado();
    const user = this.currentUser();
    
    // Validar método de envío
    if (!metodoEnvio) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona método de envío',
        text: 'Debes elegir cómo deseas recibir tu pedido'
      });
      return;
    }

    // Validar método de pago
    if (!metodoPago) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un método de pago',
        text: 'Debes elegir cómo deseas pagar'
      });
      return;
    }

    // Validar datos de envío si es a domicilio
    if (metodoEnvio === 'domicilio') {
      if (!user?.direccion || !user?.ciudad || !user?.codigoPostal) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos de envío incompletos',
          html: `
            <p>Para envío a domicilio necesitas completar:</p>
            <ul class="text-start">
              ${!user?.direccion ? '<li>Dirección</li>' : ''}
              ${!user?.ciudad ? '<li>Ciudad</li>' : ''}
              ${!user?.codigoPostal ? '<li>Código Postal</li>' : ''}
            </ul>
            <p class="text-muted small mt-2">Ve a tu perfil para completar los datos</p>
          `,
          confirmButtonText: 'Ir a mi perfil',
          showCancelButton: true,
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/perfil-usuario']);
          }
        });
        return;
      }
    }

    if (metodoPago === 'tarjeta_virtual') {
      await this.pagarConTarjetaVirtual();
    } else {
      await this.pagarConMercadoPago();
    }
  }

  async pagarConTarjetaVirtual() {
    const currentUser = this.currentUser();
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
    const total = this.totalFinal();
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

    this.procesandoPago.set(true);

    try {
      // Preparar datos del pago
      const descripcionPago = `Compra de ${items.length} producto(s) - Checkout`;
      const solicitudPago: SolicitudCrearPago = {
        tarjetaId: tarjeta.id!,
        monto: total,
        descripcion: descripcionPago,
        referenciaExterna: `CHECKOUT-${Date.now()}`,
        detalleProducto: {
          nombre: items.length === 1 ? items[0].producto.nombre : `${items.length} productos`,
          categoria: 'Compra Online',
          cantidad: items.reduce((sum, item) => sum + item.cantidad, 0),
          precioUnitario: total / items.reduce((sum, item) => sum + item.cantidad, 0)
        },
        claveIdempotencia: `checkout-${currentUser.id}-${Date.now()}`
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
      this.procesandoPago.set(false);
    }
  }

  async pagarConMercadoPago() {
    const items = this.carritoService.items();
    const usuario = this.currentUser();

    if (items.length === 0 || !usuario) {
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: 'No se puede procesar el pago'
      });
      return;
    }

    this.procesandoPago.set(true);

    const credentials = getMercadoPagoCredentials();
    const settings = getMercadoPagoSettings();
    
    // Preparar items para Mercado Pago
    const mpItems = items.map(item => {
      const precio = parseFloat(item.producto.precio.toString()) || 1;
      const cantidad = parseInt(item.cantidad.toString()) || 1;
      
      return {
        title: (item.producto.nombre || 'Producto').substring(0, 256),
        quantity: cantidad,
        unit_price: precio >= 1 ? precio : 1,
        currency_id: 'ARS'
      };
    });
    
    console.log('📦 Items preparados para MP:', mpItems);

    // Obtener la URL base
    let baseUrl = window.location.origin;
    
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = 'https://aled2025-5be25.web.app';
      console.log('🌐 Usando URL de producción para MP:', baseUrl);
    }
    
    // Configuración de preferencia
    const preference = {
      items: mpItems,
      back_urls: {
        success: `${baseUrl}/pago-exitoso`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`
      },
      auto_return: 'approved'
    };

    const headers = {
      'Authorization': `Bearer ${credentials.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    console.log('💳 Creando preferencia de Mercado Pago...');
    console.log('🔧 Modo:', settings.USE_SANDBOX ? 'SANDBOX' : 'PRODUCCIÓN');

    this.http.post('https://api.mercadopago.com/checkout/preferences', preference, { headers })
      .subscribe({
        next: (response: any) => {
          console.log('✅ Preferencia creada:', response);
          this.procesandoPago.set(false);
          
          const paymentUrl = settings.USE_SANDBOX 
            ? response.sandbox_init_point 
            : response.init_point;
          
          if (paymentUrl) {
            console.log('🔗 Redirigiendo a:', paymentUrl);
            // Redirigir a Mercado Pago
            window.location.href = paymentUrl;
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo obtener el enlace de pago'
            });
          }
        },
        error: (error: any) => {
          console.error('❌ Error creando preferencia:', error);
          this.procesandoPago.set(false);
          
          let mensaje = 'Error al conectar con Mercado Pago';
          if (error.status === 401) {
            mensaje = 'Credenciales de Mercado Pago inválidas';
          } else if (error.status === 400 && error.error?.message) {
            mensaje = `Error: ${error.error.message}`;
          }
          
          Swal.fire({
            icon: 'error',
            title: 'Error en el Pago',
            text: mensaje
          });
        }
      });
  }

  protected volverAlCarrito() {
    this.router.navigate(['/']);
  }

  /**
   * Crea un pedido real después del pago exitoso
   */
  private async crearPedidoYProcesarPago(items: any[], usuario: any, total: number, pagoId?: string): Promise<void> {
    try {
      console.log('🛒 Creando pedido después del pago exitoso...');
      
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
          direccion: this.metodoEnvioSeleccionado() === 'retiro' ? 'Retiro en local' : (usuario.direccion || 'Dirección no especificada'),
          ciudad: this.metodoEnvioSeleccionado() === 'retiro' ? 'Local comercial' : (usuario.ciudad || 'Ciudad no especificada'),
          codigoPostal: usuario.codigoPostal || '0000',
          provincia: 'Buenos Aires',
          pais: 'Argentina',
          metodoEnvio: this.metodoEnvioSeleccionado() === 'retiro' ? 'Retiro en local' : 'Envío a domicilio'
        },
        metodoPago: 'tarjeta_virtual',
        notas: `Pedido creado desde checkout - Pago ID: ${pagoId}`
      };
      
      const resultadoPedido = await this.pedidosService.crearPedido(solicitudPedido, usuario.id);
      
      if (resultadoPedido.exito && resultadoPedido.pedido) {
        console.log('✅ Pedido creado exitosamente:', resultadoPedido.pedido.numeroPedido);
        
        const resultadoProcesarPago = await this.pedidosService.procesarPagoPedido(
          resultadoPedido.pedido.id!,
          usuario.id
        );
        
        if (resultadoProcesarPago.exito) {
          console.log('✅ Pago del pedido procesado exitosamente');
        }
        
        this.procesarPagoExitoso(items, usuario, total, pagoId, resultadoPedido.pedido.numeroPedido);
      } else {
        this.procesarPagoExitoso(items, usuario, total, pagoId);
      }
      
    } catch (error) {
      console.error('❌ Error al crear pedido:', error);
      this.procesarPagoExitoso(items, usuario, total, pagoId);
    }
  }

  /**
   * Procesa un pago exitoso
   */
  private procesarPagoExitoso(items: any[], usuario: any, total: number, pagoId?: string, numeroPedido?: string): void {
    this.carritoService.vaciarCarrito();

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
      confirmButtonText: 'Ver Mis Pedidos',
      confirmButtonColor: '#28a745'
    }).then(() => {
      this.router.navigate(['/mis-pedidos']);
    });
  }
}
