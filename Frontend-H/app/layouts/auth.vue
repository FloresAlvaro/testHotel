<template>
  <main :class="['auth-shell', { dark: theme === 'dark' }]">
    <section class="auth-visual" aria-labelledby="visual-title">
      <NuxtImg
        class="auth-image"
        src="https://images.unsplash.com/photo-1566073771259-6a8506099945"
        alt="Hotel rodeado de jardines y piscina"
        width="1800"
        height="1600"
        sizes="100vw md:58vw"
        quality="84"
        format="webp"
        preload
      />
      <div class="visual-shade" aria-hidden="true" />

      <div class="visual-content">
        <NuxtLink to="/" class="visual-brand" aria-label="HotelSys, inicio">
          <span class="brand-mark">H</span>
          <span>HotelSys</span>
        </NuxtLink>

        <div class="visual-copy">
          <p class="visual-eyebrow">GESTIÓN HOTELERA, CON CALMA</p>
          <h1 id="visual-title">Cada detalle cuenta para que todo fluya.</h1>
          <p>Reservas, huéspedes y operación diaria, en un solo lugar.</p>
        </div>

        <div class="visual-caption">
          <span>EL ARTE DE RECIBIR BIEN</span>
          <span>01 — 03</span>
        </div>
      </div>
    </section>

    <section class="auth-panel" aria-label="Acceso al sistema">
      <header class="auth-topbar">
        <span>PORTAL DEL EQUIPO</span>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          :title="theme === 'dark' ? 'Tema claro' : 'Tema oscuro'"
          @click="uiStore.toggleTheme"
        >
          <Icon :name="theme === 'dark' ? 'system-uicons:sun' : 'system-uicons:moon'" size="19" />
        </button>
      </header>

      <div class="auth-content">
        <slot />
      </div>

      <footer class="auth-footer">
        <span>© 2026 HotelSys</span>
        <span>Acceso protegido</span>
      </footer>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";

const uiStore = useUiStore();
const theme = computed(() => uiStore.theme);
</script>

<style scoped lang="scss">
.auth-shell {
  --panel-bg: #f8f9f6;
  --panel-text: #1e2a24;
  --panel-muted: #758078;
  --panel-border: #dce3dd;
  --field-bg: #ffffff;

  display: grid;
  grid-template-columns: minmax(0, 1.16fr) minmax(420px, 0.84fr);
  min-height: 100vh;
  min-height: 100svh;
  background: var(--panel-bg);
  color: var(--panel-text);

  &.dark {
    --panel-bg: #151d18;
    --panel-text: #eef2ee;
    --panel-muted: #a2afa6;
    --panel-border: #344138;
    --field-bg: #1c2720;
  }
}

.auth-visual {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  background: #203c32;
  color: #ffffff;
}

.auth-image,
.visual-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.auth-image {
  object-fit: cover;
  object-position: center;
}

.visual-shade {
  background: linear-gradient(
    180deg,
    rgba(14, 30, 24, 0.2) 0%,
    rgba(14, 30, 24, 0.08) 38%,
    rgba(14, 30, 24, 0.78) 100%
  );
}

.visual-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(32px, 4.6vw, 72px);
}

.visual-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  color: #ffffff;
  font-size: 17px;
  font-weight: 600;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 38px;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.68);
  color: #f2d39d;
  font-family: "Alata", sans-serif;
  font-size: 25px;
  font-weight: 600;
}

.visual-copy {
  max-width: 620px;
  padding: 54px 0 44px;

  h1 {
    max-width: 600px;
    margin: 15px 0 17px;
    font-family: "Alata", sans-serif;
    font-size: 58px;
    font-weight: 500;
    line-height: 0.99;
  }

  > p:last-child {
    max-width: 390px;
    margin: 0;
    color: rgba(255, 255, 255, 0.84);
    font-size: 15px;
    line-height: 1.7;
  }
}

.visual-eyebrow,
.visual-caption,
.auth-topbar > span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.visual-eyebrow {
  margin: 0;
  color: #f2d39d;
}

.visual-caption {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.76);
}

.auth-panel {
  display: flex;
  min-width: 0;
  min-height: 100vh;
  min-height: 100svh;
  flex-direction: column;
  padding: clamp(26px, 4vw, 62px) clamp(26px, 5.5vw, 84px) 26px;
  background: var(--panel-bg);
  color: var(--panel-text);
}

.auth-topbar {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;

  > span {
    color: var(--panel-muted);
  }
}

.theme-toggle {
  display: grid;
  width: 40px;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--panel-border);
  border-radius: 50%;
  background: transparent;
  color: var(--panel-text);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease;

  &:hover {
    border-color: #a9b8ad;
    background: rgba(63, 99, 77, 0.08);
  }

  &:focus-visible {
    outline: 3px solid rgba(58, 100, 75, 0.26);
    outline-offset: 2px;
  }
}

.auth-content {
  width: 100%;
  max-width: 430px;
  margin: auto;
  padding: 42px 0;
}

.auth-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--panel-muted);
  font-size: 11px;
}

@media (max-width: 900px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr) minmax(390px, 0.95fr);
  }

  .visual-content {
    padding: 28px;
  }

  .visual-copy h1 {
    font-size: 46px;
  }

  .auth-panel {
    padding-inline: 34px;
  }
}

@media (max-width: 720px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .auth-visual {
    min-height: 250px;
    max-height: 34svh;
  }

  .visual-content {
    padding: 22px 24px;
  }

  .visual-copy {
    padding: 24px 0 15px;

    h1 {
      max-width: 430px;
      margin: 8px 0;
      font-size: 34px;
      line-height: 1.02;
    }

    > p:last-child {
      display: none;
    }
  }

  .visual-eyebrow,
  .visual-caption {
    font-size: 9px;
  }

  .brand-mark {
    width: 32px;
    font-size: 22px;
  }

  .auth-panel {
    min-height: 0;
    padding: 20px 24px 22px;
  }

  .auth-content {
    max-width: 480px;
    padding: 40px 0;
  }
}

@media (max-width: 390px) {
  .auth-panel {
    padding-inline: 18px;
  }

  .visual-copy h1 {
    font-size: 30px;
  }
}
</style>