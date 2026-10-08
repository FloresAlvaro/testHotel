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

      <p v-if="authStore.error" class="field-error login-error" role="alert">
        {{ authStore.error }}
      </p>

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
import { getDefaultRouteForRole } from "~/utils/authRoutes";

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
      getDefaultRouteForRole(authStore.user?.role);
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
      typeof queryRedirect === "string"
        ? queryRedirect
        : getDefaultRouteForRole(authStore.user?.role),
    );
  }
});
</script>

<style scoped src="~/assets/styles/pages/auth/login.css"></style>