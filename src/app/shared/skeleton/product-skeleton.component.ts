import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-grid">
      <div class="skeleton-card" *ngFor="let item of skeletonArray">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-category"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-title short"></div>
          <div class="skeleton-price"></div>
          <div class="skeleton-shipping"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      padding: 20px 0;
    }

    .skeleton-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .skeleton-image {
      height: 240px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      padding: 20px;
    }

    .skeleton-category {
      height: 16px;
      width: 60px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .skeleton-title {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .skeleton-title.short {
      width: 70%;
    }

    .skeleton-price {
      height: 24px;
      width: 80px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .skeleton-shipping {
      height: 14px;
      width: 100px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .skeleton-button {
      height: 44px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .skeleton-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
      }

      .skeleton-image {
        height: 200px;
      }

      .skeleton-content {
        padding: 16px;
      }
    }
  `]
})
export class ProductSkeletonComponent {
  @Input() count = 6;

  get skeletonArray(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
