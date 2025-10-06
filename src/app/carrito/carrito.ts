import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CarritoService } from '../services/carrito';
import { AuthService } from '../auth/auth';
import { UserService } from '../services/user';
import { InicioDeSesion } from '../auth/inicio-sesion/inicio-sesion';
import { Registro } from '../auth/registro/registro';
import { AuthRequeridoComponent } from '../auth/auth-requerido/auth-requerido';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
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

    this.cargandoMP.set(true);
    this.activeOffcanvas.dismiss('Processing payment');

    const functionUrl = 'https://us-central1-aled3-6b4ee.cloudfunctions.net/createPreferenceV1';

    this.http.post<{ id: string }>(functionUrl, { items, metodoEntrega }).subscribe({
      next: (res) => {
        window.location.href = `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?preference_id=${res.id}`;
      },
      error: (err) => {
        console.error('Error al crear la preferencia de Mercado Pago:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un error al intentar procesar el pago. Por favor, intenta de nuevo.',
        });
        this.cargandoMP.set(false);
      },
    });
  }
}
