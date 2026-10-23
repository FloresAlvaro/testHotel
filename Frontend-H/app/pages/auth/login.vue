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
            :disabled="loading || !ready"
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
            :disabled="loading || !ready"
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
        :disabled="loading || !isFormValid || !ready"
      >
        <span>{{ loading ? 'Validando acceso…' : 'Iniciar sesión' }}</span>
        <span v-if="loading" class="submit-spinner" aria-hidden="true" />
        <Icon v-else name="system-uicons:arrow-right" size="20" aria-hidden="true" />
      </button>

      <p class="security-note">
        <Icon name="system-uicons:lock" size="16" aria-hidden="true" />
        Acceso seguro para huéspedes y equipo del hotel
      </p>
    </form>

    <div class="register-prompt">
      <span>¿Necesitas acceso?</span>
      <NuxtLink to="/auth/register">Contacta al hotel</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { postLoginPath } from "~/utils/authNavigation";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "~/stores/auth";
import { useUIStore } from "~/stores/ui";
import { useAuthService } from "~/services/auth";
import { isValidEmail, isValidPasswordLength } from "~/utils/validators";

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
const ready = ref(false);
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
    : !isValidPasswordLength(form.value.password)
      ? "Debe tener al menos 8 caracteres y no superar 72 bytes UTF-8"
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

watch(() => form.value.email, () => { if (errors.value.email) validateField('email'); });
watch(() => form.value.password, () => { if (errors.value.password) validateField('password'); });

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
    await router.push(postLoginPath(authStore.user?.role, redirectUrl));
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
  ready.value = true;
  if (authStore.isAuthenticated) {
    const queryRedirect = route.query.redirect;
    router.replace(
      postLoginPath(authStore.user?.role, queryRedirect),
    );
  }
});
</script>


<style scoped>
.login-heading { margin-bottom:32px; }
.login-heading h1 { margin:0 0 9px; font-size:26px; line-height:1.2; font-weight:600; letter-spacing:-.8px; color:var(--text-primary); }
.login-heading p { font-size:13px; color:var(--text-secondary); margin:0; }
.login-form { display:flex; flex-direction:column; gap:22px; }
.form-field label { display:block; color:var(--text-primary); font-size:12px; font-weight:500; margin-bottom:8px; }
.field-heading { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.forgot-link { font-size:11px; color:var(--text-secondary); text-decoration:none; }
.input-shell { display:flex; align-items:center; gap:10px; min-height:44px; border:1px solid var(--border-color); border-radius:7px; padding:0 12px; color:var(--text-tertiary); background:var(--bg-secondary); }
.input-shell:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft); }
.input-shell input { flex:1; min-width:0; padding:12px 0; border:0; outline:none; background:transparent; color:var(--text-primary); font-size:12px; }
.input-shell input::placeholder { color:var(--text-tertiary); }
.password-toggle { display:flex; align-items:center; justify-content:center; border:0; background:transparent; color:var(--text-tertiary); padding:4px; }
.field-error { font-size:11px; color:var(--danger); margin-top:7px; }
.has-error .input-shell { border-color:var(--danger); }
.login-submit { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; min-height:43px; border-radius:7px; background:#535ed6; color:white; border:0; font-size:12px; font-weight:500; margin-top:2px; }
.login-submit:hover:not(:disabled) { background:#424ebf; }
.login-submit:disabled { opacity:.5; }
.security-note { display:flex; justify-content:center; gap:6px; font-size:10px; color:var(--text-tertiary); margin:-4px 0 0; }
.register-prompt { margin-top:28px; padding-top:24px; border-top:1px solid var(--border-color); display:flex; justify-content:center; flex-wrap:wrap; gap:5px; color:var(--text-secondary); font-size:11px; }
.register-prompt a { color:var(--accent); text-decoration:none; }
.submit-spinner { width:13px; height:13px; border:2px solid #ffffff60; border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
