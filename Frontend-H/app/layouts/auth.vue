<template>
  <main :class="['auth-shell', { dark: theme === 'dark' }]">
    <section class="auth-visual" aria-labelledby="visual-title">
      <div class="visual-content">
        <NuxtLink to="/" class="visual-brand" aria-label="Roomly, inicio">
          <span class="brand-mark">R</span>
          <span>Roomly</span>
        </NuxtLink>

        <div class="visual-copy">
          <p class="visual-eyebrow">EL PORTAL DE TU HOTEL</p>
          <h1 id="visual-title">Bienvenido de nuevo</h1>
          <p>Reservas, huéspedes y cada detalle de la operación, siempre a mano.</p>
        </div>

        <div class="visual-caption">
          <span class="caption-mark" aria-hidden="true">✓</span>
          <span>Acceso privado para el equipo del hotel</span>
        </div>
      </div>
    </section>

    <section class="auth-panel" aria-label="Acceso al sistema">
      <header class="auth-topbar">
        <span/>
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
        <span>© 2026 Roomly</span>
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
  --panel-bg: #f5f4ff;
  --panel-text: #252b3d;
  --panel-muted: #707b96;
  --panel-border: #e1e3f0;
  --field-bg: #ffffff;

  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(390px, 1fr);
  gap: 0;
  padding: 12px;
  min-height: 100vh;
  min-height: 100svh;
  background: #ffffff;
  color: var(--panel-text);

  &.dark {
    --panel-bg: #1d1d2b;
    --panel-text: #f2f1fa;
    --panel-muted: #aaa9bf;
    --panel-border: #38384d;
    --field-bg: #242437;

    background: #15151f;
  }
}

.auth-visual {
  position: relative;
  min-height: calc(100svh - 24px);
  overflow: hidden;
  border: 1px solid #e7e7f2;
  background:
    radial-gradient(ellipse at 72% 55%, rgba(119, 111, 255, 0.08), transparent 38%),
    #ffffff;
  color: var(--panel-text);

  .dark & {
    border-color: var(--panel-border);
    background:
      radial-gradient(ellipse at 72% 55%, rgba(119, 111, 255, 0.12), transparent 38%),
      #191923;
  }
}

.visual-content {
  position: relative;
  min-height: calc(100svh - 26px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(30px, 4.4vw, 68px);
}

.visual-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  color: var(--panel-text);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  width: 34px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 8px;
  background: #5148e8;
  color: #ffffff;
  font-family: "Alata", sans-serif;
  font-size: 20px;
  font-weight: 600;
}

.visual-copy {
  max-width: 570px;
  padding: 48px 0;

  h1 {
    max-width: 540px;
    margin: 14px 0 15px;
    font-family: "Alata", sans-serif;
    font-size: clamp(42px, 4.2vw, 58px);
    font-weight: 400;
    line-height: 1.02;

    span {
      display: block;
      color: #5148e8;
    }
  }

  > p:last-child {
    max-width: 360px;
    margin: 0;
    color: var(--panel-muted);
    font-size: 14px;
    line-height: 1.65;
  }

  .dark & h1 span {
    color: #a8a1ff;
  }
}

.visual-eyebrow,
.visual-caption,
.auth-topbar > span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.visual-eyebrow {
  margin: 0;
  color: #5148e8;
}

.visual-caption {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--panel-muted);
  font-size: 12px;
  letter-spacing: 0;
}

.caption-mark {
  display: grid;
  width: 22px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  background: #eeedff;
  color: #5148e8;
  font-size: 13px;
}

.auth-panel {
  display: flex;
  min-width: 0;
  min-height: calc(100svh - 24px);
  flex-direction: column;
  padding: clamp(24px, 3.8vw, 54px) clamp(24px, 4vw, 60px) 22px;
  border: 1px solid #e5e4f3;
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
    border-color: #aaa5f1;
    background: rgba(81, 72, 232, 0.08);
  }

  &:focus-visible {
    outline: 3px solid rgba(81, 72, 232, 0.26);
    outline-offset: 2px;
  }
}

.auth-content {
  width: 100%;
  max-width: 390px;
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
    grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.95fr);
  }

  .visual-content {
    padding: 32px;
  }

  .visual-copy h1 {
    font-size: 42px;
  }

  .auth-panel {
    padding-inline: 30px;
  }
}

@media (max-width: 720px) {
  .auth-shell {
    grid-template-columns: minmax(0, 1fr);
    padding: 8px;
  }

  .auth-visual {
    min-height: 218px;
    max-height: 30svh;
  }

  .visual-content {
    min-height: 216px;
    padding: 20px 22px;
  }

  .visual-copy {
    padding: 14px 0 10px;

    h1 {
      max-width: 480px;
      margin: 7px 0;
      font-size: 31px;
      line-height: 1.02;
    }

    > p:last-child {
      max-width: 440px;
      font-size: 12px;
    }
  }

  .brand-mark {
    width: 29px;
    font-size: 18px;
  }

  .auth-panel {
    min-height: 0;
    padding: 18px 22px 16px;
  }

  .auth-content {
    max-width: 480px;
    padding: 30px 0;
  }

  .auth-footer {
    padding-top: 4px;
  }
}

@media (max-width: 390px) {
  .auth-panel {
    padding-inline: 16px;
  }

  .visual-copy h1 {
    font-size: 28px;
  }
}
</style>