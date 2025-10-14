import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Contenedor de toasts -->
    <div class="toast-container">
      @for (toast of toastService.getToasts(); track toast.id) {
        <div 
          class="toast-item toast-{{ toast.type }}"
          [attr.data-toast-id]="toast.id"
        >
          <div class="toast-content">
            <div class="toast-icon">
              <i [class]="toast.icon"></i>
            </div>
            <div class="toast-text">
              <div class="toast-title">{{ toast.title }}</div>
              <div class="toast-message">{{ toast.message }}</div>
            </div>
            <button 
              class="toast-close"
              (click)="toastService.remove(toast.id)"
              aria-label="Cerrar notificación"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
          <div class="toast-progress"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      width: 100%;
    }

    .toast-item {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      margin-bottom: 12px;
      overflow: hidden;
      position: relative;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid;
    }

    .toast-success { border-left-color: #10b981; }
    .toast-error { border-left-color: #ef4444; }
    .toast-warning { border-left-color: #f59e0b; }
    .toast-info { border-left-color: #3b82f6; }

    .toast-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 14px;
      color: white;
    }

    .toast-success .toast-icon { background: #10b981; }
    .toast-error .toast-icon { background: #ef4444; }
    .toast-warning .toast-icon { background: #f59e0b; }
    .toast-info .toast-icon { background: #3b82f6; }

    .toast-text {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      padding: 4px;
      border-radius: 4px;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toast-close:hover {
      background: #f3f4f6;
      color: #6b7280;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, currentColor, transparent);
      animation: progress 4s linear;
    }

    .toast-success .toast-progress { color: #10b981; }
    .toast-error .toast-progress { color: #ef4444; }
    .toast-warning .toast-progress { color: #f59e0b; }
    .toast-info .toast-progress { color: #3b82f6; }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes progress {
      from { width: 100%; }
      to { width: 0%; }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
