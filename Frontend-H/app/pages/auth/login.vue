<template>
  <section class="login-page" aria-labelledby="login-title">
    <header class="login-heading">
      <h1 id="login-title">Iniciar sesión</h1>
      <p>Ingresa tus datos para continuar.</p>
    </header>

    <form class="login-form" @submit.prevent="handleLogin">
      <div class="form-field" :class="{ 'has-error': errors.email }">
        <label for="login-email">Correo electrónico</label>
        <div class="input-shell">
          <Icon name="system-uicons:mail" size="19" aria-hidden="true" />
          <input
            id="login-email"
            v-model.trim="form.email"
            type="email"
            name="email"
            placeholder="nombre@hotel.com"
            autocomplete="username"
            inputmode="email"
            autocapitalize="none"
            spellcheck="false"
            required
            :disabled="loading"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'login-email-error' : undefined"
            @blur="validateField('email')"
          >
        </div>
        <p v-if="errors.email" id="login-email-error" class="field-error" role="alert">
          {{ errors.email }}
        </p>
      </div>

      <div class="form-field" :class="{ 'has-error': errors.password }">
        <div class="field-heading">
          <label for="login-password">Contraseña</label>
          <NuxtLink to="/auth/forgot-password" class="forgot-link">
            ¿La olvidaste?
          </NuxtLink>
        </div>
        <div class="input-shell">
          <Icon name="system-uicons:lock" size="19" aria-hidden="true" />
          <input
            id="login-password"
            v-model="form.password"
            :type="passwordVisible ? 'text' : 'password'"
            name="password"
            placeholder="Escribe tu contraseña"
            autocomplete="current-password"
            required
            :disabled="loading"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'login-password-error' : undefined"
            @blur="validateField('password')"
          >
          <button
            class="password-toggle"
            type="button"
            :aria-label="passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            :aria-pressed="passwordVisible"
            @click="passwordVisible = !passwordVisible"
          >
            <Icon :name="passwordVisible ? 'system-uicons:eye-closed' : 'system-uicons:eye'" size="19" />
          </button>
        </div>
        <p v-if="errors.password" id="login-password-error" class="field-error" role="alert">
          {{ errors.password }}
        </p>
      </div>

      <button
        class="login-submit"
        type="submit"
        :disabled="loading || !isFormValid"
      >
        <span>{{ loading ? 'Validando acceso…' : 'Iniciar sesión' }}</span>
        <span v-if="loading" class="submit-spinner" aria-hidden="true" />
        <Icon v-else name="system-uicons:arrow-right" size="20" aria-hidden="true" />
      </button>

      <p class="security-note">
        <Icon name="system-uicons:lock" size="16" aria-hidden="true" />
        Acceso privado para el equipo del hotel
      </p>
    </form>

    <div class="register-prompt">
      <span>¿Primera vez aquí?</span>
      <NuxtLink to="/auth/register">Crear una cuenta</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";
import { useAuthService } from "~/services/auth";
import { isValidEmail, isValidLength } from "~/utils/validators";

definePageMeta({
  layout: "auth",
  middleware: "auth",
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUIStore();
const authService = useAuthService();

const loading = ref(false);
const passwordVisible = ref(false);
const form = ref({ email: "", password: "" });
const errors = ref({ email: "", password: "" });

const validateField = (field: "email" | "password") => {
  if (field === "email") {
    errors.value.email = !form.value.email
      ? "El correo es obligatorio"
      : !isValidEmail(form.value.email)
        ? "Escribe un correo válido"
        : "";
    return;
  }

  errors.value.password = !form.value.password
    ? "La contraseña es obligatoria"
    : !isValidLength(form.value.password, 8, 128)
      ? "Debe tener entre 8 y 128 caracteres"
      : "";
};

const isFormValid = computed(() =>
  Boolean(
    form.value.email &&
      form.value.password &&
      !errors.value.email &&
      !errors.value.password,
  ),
);

const handleLogin = async () => {
  validateField("email");
  validateField("password");
  if (!isFormValid.value) return;

  loading.value = true;
  authStore.clearError();

  try {
    await authService.login(form.value.email, form.value.password);

    const queryRedirect = route.query.redirect;
    const redirectUrl =
      (typeof queryRedirect === "string" ? queryRedirect : null) ||
      sessionStorage.getItem("redirectUrl") ||
      "/dashboard";
    sessionStorage.removeItem("redirectUrl");
    await router.push(redirectUrl);
  } catch (error: unknown) {
    if (!authStore.error) {
      uiStore.error(
        error instanceof Error ? error.message : "No se pudo iniciar sesión",
      );
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    const queryRedirect = route.query.redirect;
    router.replace(
      typeof queryRedirect === "string" ? queryRedirect : "/dashboard",
    );
  }
});
</script>

<style scoped>
.login-page {
  width: 100%;
}

.login-heading {
  margin-bottom: 25px;

  h1 {
    margin: 0 0 6px;
    color: var(--panel-text);
    font-family: "Alata", sans-serif;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.2;
  }

  > p:last-child {
    margin: 0;
    color: var(--panel-muted);
    font-size: 13px;
    line-height: 1.6;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 9px;

  label {
    color: var(--panel-text);
    font-size: 13px;
    font-weight: 600;
  }
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.input-shell {
  display: flex;
  min-width: 0;
  min-height: 48px;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  background: var(--field-bg);
  color: #8189a4;
  transition: border-color 160ms ease, box-shadow 160ms ease;

  &:focus-within {
    border-color: #7168ef;
    box-shadow: 0 0 0 3px rgba(81, 72, 232, 0.12);
  }

  input {
    width: 100%;
    min-width: 0;
    height: 46px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--panel-text);
    font: inherit;
    font-size: 14px;

    &::placeholder {
      color: #9aa59e;
      opacity: 1;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }
  }
}

.password-toggle {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #8189a4;
  cursor: pointer;

  &:hover {
    background: rgba(81, 72, 232, 0.1);
    color: #5148e8;
  }

  &:focus-visible {
    outline: 2px solid #5148e8;
    outline-offset: 2px;
  }
}

.forgot-link,
.register-prompt a {
  color: #5148e8;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: #3931c6;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}

.field-error {
  margin: 0;
  color: #b8443c;
  font-size: 12px;
}

.has-error .input-shell {
  border-color: #c45b51;
}

.login-submit {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 2px;
  padding: 0 20px;
  border: 1px solid #5148e8;
  border-radius: 6px;
  background: #5148e8;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 160ms ease, transform 160ms ease;

  &:hover:not(:disabled) {
    background: #4037d2;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid rgba(81, 72, 232, 0.28);
    outline-offset: 3px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.submit-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 650ms linear infinite;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: -8px 0 0;
  color: var(--panel-muted);
  font-size: 11px;
}

.register-prompt {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--panel-border);
  color: var(--panel-muted);
  font-size: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .login-heading h1 { font-size: 26px; }
}

@media (max-width: 390px) {
  .login-heading {
    margin-bottom: 28px;

    h1 {
      font-size: 25px;
    }
  }

  .login-form {
    gap: 19px;
  }
}
</style>