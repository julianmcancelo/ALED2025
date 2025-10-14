import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class]="'loading-' + type">
      @switch (type) {
        @case ('spinner') {
          <div class="spinner">
            <div class="spinner-ring"></div>
          </div>
        }
        @case ('dots') {
          <div class="dots-loading">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        }
        @case ('pulse') {
          <div class="pulse-loading">
            <div class="pulse-circle"></div>
          </div>
        }
        @case ('skeleton') {
          <div class="skeleton-loading">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-text"></div>
            <div class="skeleton-line skeleton-text short"></div>
          </div>
        }
        @default {
          <div class="default-spinner"></div>
        }
      }
      
      @if (message) {
        <div class="loading-message">{{ message }}</div>
      }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    /* Spinner moderno */
    .spinner {
      width: 40px;
      height: 40px;
      position: relative;
    }

    .spinner-ring {
      width: 100%;
      height: 100%;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #0077b6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Dots loading */
    .dots-loading {
      display: flex;
      gap: 8px;
    }

    .dot {
      width: 12px;
      height: 12px;
      background: #0077b6;
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite both;
    }

    .dot:nth-child(1) { animation-delay: -0.32s; }
    .dot:nth-child(2) { animation-delay: -0.16s; }

    /* Pulse loading */
    .pulse-loading {
      width: 40px;
      height: 40px;
      position: relative;
    }

    .pulse-circle {
      width: 100%;
      height: 100%;
      background: #0077b6;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* Skeleton loading */
    .skeleton-loading {
      width: 200px;
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .skeleton-title {
      height: 20px;
      width: 60%;
    }

    .skeleton-text {
      width: 100%;
    }

    .skeleton-text.short {
      width: 40%;
      margin-bottom: 0;
    }

    /* Default spinner */
    .default-spinner {
      width: 32px;
      height: 32px;
      border: 2px solid #f3f4f6;
      border-top: 2px solid #0077b6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Loading message */
    .loading-message {
      margin-top: 12px;
      font-size: 14px;
      color: #6b7280;
      text-align: center;
    }

    /* Animations */
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    @keyframes pulse {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 0;
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Variantes de tamaño */
    .loading-small .spinner,
    .loading-small .pulse-loading {
      width: 24px;
      height: 24px;
    }

    .loading-large .spinner,
    .loading-large .pulse-loading {
      width: 60px;
      height: 60px;
    }

    .loading-small .dot {
      width: 8px;
      height: 8px;
    }

    .loading-large .dot {
      width: 16px;
      height: 16px;
    }
  `]
})
export class LoadingComponent {
  @Input() type: 'spinner' | 'dots' | 'pulse' | 'skeleton' = 'spinner';
  @Input() message?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
}
