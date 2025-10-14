import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartButtonComponent } from '../cart/cart-button.component';

export interface ProductCard {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  categoria?: string;
  descripcion?: string;
  descuento?: number;
  esDestacado?: boolean;
}

@Component({
  selector: 'app-modern-product-card',
  standalone: true,
  imports: [CommonModule, CartButtonComponent],
  template: `
    <div class="product-card" [class.featured]="product.esDestacado">
      <!-- Badge de descuento -->
      <div class="discount-badge" *ngIf="product.descuento && product.descuento > 0">
        -{{ product.descuento }}%
      </div>

      <!-- Badge destacado -->
      <div class="featured-badge" *ngIf="product.esDestacado">
        <i class="bi bi-star-fill"></i>
        Destacado
      </div>

      <!-- Imagen del producto -->
      <div class="image-container" (click)="onProductClick()">
        <img 
          *ngIf="product.imagen" 
          [src]="product.imagen" 
          [alt]="product.nombre"
          class="product-image"
          (error)="onImageError($event)"
        >
        <div *ngIf="!product.imagen" class="image-placeholder">
          <i class="bi bi-image"></i>
          <span>Sin imagen</span>
        </div>
        
        <!-- Overlay con acciones rápidas -->
        <div class="image-overlay">
          <button class="quick-action-btn" (click)="onQuickView($event)" title="Vista rápida">
            <i class="bi bi-eye"></i>
          </button>
          <button class="quick-action-btn" (click)="onToggleFavorite($event)" title="Favorito">
            <i [class]="isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
          </button>
        </div>
      </div>

      <!-- Información del producto -->
      <div class="product-info">
        <!-- Categoría -->
        <div class="category-tag" *ngIf="product.categoria">
          {{ product.categoria }}
        </div>

        <!-- Título -->
        <h3 class="product-title" (click)="onProductClick()">
          {{ product.nombre }}
        </h3>

        <!-- Descripción -->
        <p class="product-description" *ngIf="product.descripcion">
          {{ product.descripcion }}
        </p>

        <!-- Precio -->
        <div class="price-container">
          <div class="current-price">
            {{ getCurrentPrice() | currency:'ARS':'symbol':'1.0-0' }}
          </div>
          <div class="original-price" *ngIf="product.descuento && product.descuento > 0">
            {{ product.precio | currency:'ARS':'symbol':'1.0-0' }}
          </div>
        </div>

        <!-- Información de envío -->
        <div class="shipping-info">
          <span class="shipping-text" [class.free]="isFreeShipping()">
            <i [class]="isFreeShipping() ? 'bi bi-truck' : 'bi bi-truck'"></i>
            {{ getShippingText() }}
          </span>
        </div>

        <!-- Botón de agregar al carrito -->
        <app-cart-button 
          [isAdding]="isAddingToCart"
          (cartClick)="onAddToCart()"
          class="add-to-cart-btn">
        </app-cart-button>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      cursor: pointer;
    }

    .product-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    }

    .product-card.featured {
      border: 2px solid #fbbf24;
      box-shadow: 0 4px 20px rgba(251, 191, 36, 0.2);
    }

    .product-card.featured:hover {
      box-shadow: 0 20px 40px rgba(251, 191, 36, 0.3);
    }

    .discount-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      z-index: 2;
      animation: pulse 2s infinite;
    }

    .featured-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .image-container {
      position: relative;
      height: 240px;
      overflow: hidden;
      background: #f8fafc;
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }

    .product-card:hover .product-image {
      transform: scale(1.05);
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 48px;
    }

    .image-placeholder span {
      font-size: 14px;
      margin-top: 8px;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .product-card:hover .image-overlay {
      opacity: 1;
    }

    .quick-action-btn {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .quick-action-btn:hover {
      background: white;
      transform: scale(1.1);
      color: #0077b6;
    }

    .product-info {
      padding: 20px;
    }

    .category-tag {
      display: inline-block;
      background: #f1f5f9;
      color: #64748b;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .product-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .product-title:hover {
      color: #0077b6;
    }

    .product-description {
      font-size: 13px;
      color: #64748b;
      line-height: 1.4;
      margin: 0 0 12px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .price-container {
      margin-bottom: 12px;
    }

    .current-price {
      font-size: 20px;
      font-weight: 700;
      color: #0077b6;
      margin-bottom: 2px;
    }

    .original-price {
      font-size: 14px;
      color: #94a3b8;
      text-decoration: line-through;
    }

    .shipping-info {
      margin-bottom: 16px;
    }

    .shipping-text {
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .shipping-text.free {
      color: #059669;
    }

    .shipping-text:not(.free) {
      color: #dc2626;
    }

    .add-to-cart-btn {
      width: 100%;
    }

    /* Animaciones */
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .image-container {
        height: 200px;
      }

      .product-info {
        padding: 16px;
      }

      .product-title {
        font-size: 15px;
      }

      .current-price {
        font-size: 18px;
      }
    }
  `]
})
export class ModernProductCardComponent {
  @Input() product!: ProductCard;
  @Input() isFavorite = false;
  @Input() isAddingToCart = false;

  @Output() productClick = new EventEmitter<ProductCard>();
  @Output() addToCart = new EventEmitter<ProductCard>();
  @Output() quickView = new EventEmitter<ProductCard>();
  @Output() toggleFavorite = new EventEmitter<ProductCard>();

  onProductClick(): void {
    this.productClick.emit(this.product);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }

  onQuickView(event: Event): void {
    event.stopPropagation();
    this.quickView.emit(this.product);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit(this.product);
  }

  onImageError(event: any): void {
    event.target.style.display = 'none';
  }

  getCurrentPrice(): number {
    if (this.product.descuento && this.product.descuento > 0) {
      return this.product.precio * (1 - this.product.descuento / 100);
    }
    return this.product.precio;
  }

  isFreeShipping(): boolean {
    return this.getCurrentPrice() > 50000;
  }

  getShippingText(): string {
    return this.isFreeShipping() ? 'Envío gratis' : 'Envío $1.000';
  }
}
