<template>
  <div class="auth-wrapper" :class="{ dark: theme === 'dark' }">
    <div class="auth-container">
      <!-- Logo -->
      <div class="auth-logo">
        <h1>🏨 HotelSys</h1>
        <p>Sistema de Gestión Hotelera</p>
      </div>

      <!-- Content -->
      <div class="auth-content">
        <slot />
      </div>

      <!-- Footer -->
      <div class="auth-footer">
        <button class="theme-toggle" @click="uiStore.toggleTheme">
          {{ theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro' }}
        </button>
        <p>&copy; 2026 HotelSys. Todos los derechos reservados.</p>
      </div>
    </div>

    <!-- Lado derecho (decorativo) -->
    <div class="auth-decoration">
      <div class="decoration-content">
        <h2>Bienvenido a HotelSys</h2>
        <p>Gestión hotelera moderna y eficiente</p>
        <div class="features">
          <div class="feature">
            <span>📅</span>
            <p>Reservas en tiempo real</p>
          </div>
          <div class="feature">
            <span>🛏️</span>
            <p>Control de habitaciones</p>
          </div>
          <div class="feature">
            <span>💰</span>
            <p>Gestión de pagos</p>
          </div>
          <div class="feature">
            <span>📊</span>
            <p>Reportes detallados</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const uiStore = useUiStore();

const theme = computed(() => uiStore.theme);
</script>

<style scoped lang="scss">
.auth-wrapper {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;

  &.dark {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: #ffffff;
    --text-secondary: #b0b0b0;
    --border-color: #404040;
  }

  &:not(.dark) {
    --bg-primary: #f5f5f5;
    --bg-secondary: #ffffff;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --border-color: #e0e0e0;
  }
}

// ==================== CONTENEDOR PRINCIPAL ====================
.auth-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);

  @media (max-width: 768px) {
    background: var(--bg-primary);
  }
}

// ==================== LOGO ====================
.auth-logo {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    margin: 0;
    font-size: 2.5rem;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    margin: 8px 0 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
}

// ==================== CONTENIDO ====================
.auth-content {
  width: 100%;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

// ==================== FOOTER ====================
.auth-footer {
  margin-top: 40px;
  text-align: center;

  .theme-toggle {
    background: none;
    border: 2px solid var(--border-color);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s;
    margin-bottom: 16px;
    display: block;
    margin-left: auto;
    margin-right: auto;

    &:hover {
      background: var(--bg-primary);
      border-color: #3b82f6;
      color: #3b82f6;
    }
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
}

// ==================== DECORACIÓN (DERECHA) ====================
.auth-decoration {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  display: none;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 40px;

  @media (min-width: 1024px) {
    display: flex;
  }

  .decoration-content {
    text-align: center;

    h2 {
      font-size: 2rem;
      margin: 0 0 16px;
    }

    p {
      font-size: 1.1rem;
      margin: 0 0 40px;
      opacity: 0.9;
    }

    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;

      .feature {
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        backdrop-filter: blur(10px);

        span {
          display: block;
          font-size: 2rem;
          margin-bottom: 8px;
        }

        p {
          margin: 0;
          font-size: 0.95rem;
        }
      }
    }
  }
}
</style>