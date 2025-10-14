import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="cart-btn"
      [class.adding]="isAdding"
      [disabled]="isAdding"
      (click)="handleClick()"
    >
      <div class="btn-content">
        <i [class]="getIconClass()"></i>
        <span class="btn-text">{{ getText() }}</span>
      </div>
      
      <!-- Animación de éxito -->
      <div class="success-animation" [class.show]="showSuccess">
        <i class="bi bi-check-circle-fill"></i>
      </div>
    </button>
  `,
  styles: [`
    .cart-btn {
      position: relative;
      background: linear-gradient(135deg, #0077b6 0%, #005f8a 100%);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 140px;
      height: 44px;
    }

    .cart-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 119, 182, 0.3);
    }

    .cart-btn:active {
      transform: translateY(0);
    }

    .cart-btn:disabled {
      cursor: not-allowed;
      opacity: 0.8;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .cart-btn.adding .btn-content {
      opacity: 0.7;
    }

    .btn-text {
      transition: all 0.3s ease;
    }

    .success-animation {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      color: #10b981;
      font-size: 24px;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .success-animation.show {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }

    /* Animación de loading */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .cart-btn.adding i {
      animation: spin 1s linear infinite;
    }

    /* Efecto ripple */
    .cart-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .cart-btn:active::before {
      width: 300px;
      height: 300px;
    }

    /* Estados específicos */
    .cart-btn.success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .cart-btn.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .cart-btn {
        padding: 10px 16px;
        font-size: 13px;
        min-width: 120px;
        height: 40px;
      }
    }
  `]
})
export class CartButtonComponent {
  @Input() isAdding = false;
  @Input() disabled = false;
  @Input() variant: 'default' | 'success' | 'error' = 'default';
  @Output() cartClick = new EventEmitter<void>();

  showSuccess = false;

  handleClick(): void {
    if (this.disabled || this.isAdding) return;
    
    this.cartClick.emit();
    this.showSuccessAnimation();
  }

  private showSuccessAnimation(): void {
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
    }, 1500);
  }

  getIconClass(): string {
    if (this.isAdding) return 'bi bi-arrow-clockwise';
    if (this.showSuccess) return 'bi bi-check-circle-fill';
    return 'bi bi-cart-plus';
  }

  getText(): string {
    if (this.isAdding) return 'Agregando...';
    if (this.showSuccess) return '¡Agregado!';
    return 'Agregar al carrito';
  }
}
