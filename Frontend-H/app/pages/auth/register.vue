<template>
  <section class="register-page" aria-labelledby="register-title">
    <header class="register-heading">
      <h1 id="register-title">Crear cuenta</h1>
      <p>Completa tus datos para unirte al equipo.</p>
    </header>

    <form class="register-form" @submit.prevent="handleRegister">
      <div class="form-field" :class="{ 'has-error': errors.name }">
        <label for="register-name">Nombre completo</label>
        <div class="input-shell">
          <Icon name="system-uicons:user" size="19" aria-hidden="true" />
          <input
            id="register-name"
            v-model.trim="form.name"
            type="text"
            name="name"
            placeholder="Nombre y apellido"
            autocomplete="name"
            required
            :disabled="loading"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'register-name-error' : undefined"
            @blur="validateField('name')"
          >
        </div>
        <p v-if="errors.name" id="register-name-error" class="field-error" role="alert">
          {{ errors.name }}
        </p>
      </div>

      <div class="form-field" :class="{ 'has-error': errors.email }">
        <label for="register-email">Correo electrónico</label>
        <div class="input-shell">
          <Icon name="system-uicons:mail" size="19" aria-hidden="true" />
          <input
            id="register-email"
            v-model.trim="form.email"
            type="email"
            name="email"
            placeholder="nombre@hotel.com"
            autocomplete="email"
            inputmode="email"
            autocapitalize="none"
            spellcheck="false"
            required
            :disabled="loading"
            :aria-invalid="Boolean(errors.email)"
            :aria-describedby="errors.email ? 'register-email-error' : undefined"
            @blur="validateField('email')"
          >
        </div>
        <p v-if="errors.email" id="register-email-error" class="field-error" role="alert">
          {{ errors.email }}
        </p>
      </div>

      <div class="form-field" :class="{ 'has-error': errors.password }">
        <label for="register-password">Contraseña</label>
        <div class="input-shell">
          <Icon name="system-uicons:lock" size="19" aria-hidden="true" />
          <input
            id="register-password"
            v-model="form.password"
            :type="passwordVisible ? 'text' : 'password'"
            name="password"
            placeholder="Crea una contraseña"
            autocomplete="new-password"
            required
            :disabled="loading"
            :aria-invalid="Boolean(errors.password)"
            :aria-describedby="errors.password ? 'register-password-error' : undefined"
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
        <p v-if="errors.password" id="register-password-error" class="field-error" role="alert">
          {{ errors.password }}
        </p>
      </div>

      <div class="form-field" :class="{ 'has-error': errors.confirmPassword }">
        <label for="register-confirm-password">Confirmar contraseña</label>
        <div class="input-shell">
          <Icon name="system-uicons:lock" size="19" aria-hidden="true" />
          <input
            id="register-confirm-password"
            v-model="form.confirmPassword"
            :type="confirmPasswordVisible ? 'text' : 'password'"
            name="confirmPassword"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
            required
            :disabled="loading"
            :aria-invalid="Boolean(errors.confirmPassword)"
            :aria-describedby="errors.confirmPassword ? 'register-confirm-password-error' : undefined"
            @blur="validateField('confirmPassword')"
          >
          <button
            class="password-toggle"
            type="button"
            :aria-label="confirmPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            :aria-pressed="confirmPasswordVisible"
            @click="confirmPasswordVisible = !confirmPasswordVisible"
          >
            <Icon :name="confirmPasswordVisible ? 'system-uicons:eye-closed' : 'system-uicons:eye'" size="19" />
          </button>
        </div>
        <p v-if="errors.confirmPassword" id="register-confirm-password-error" class="field-error" role="alert">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <button
        class="register-submit"
        type="submit"
        :disabled="loading || !isFormValid"
      >
        <span>{{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}</span>
        <span v-if="loading" class="submit-spinner" aria-hidden="true" />
        <Icon v-else name="system-uicons:arrow-right" size="20" aria-hidden="true" />
      </button>

      <p class="security-note">
        <Icon name="system-uicons:lock" size="16" aria-hidden="true" />
        Acceso privado para el equipo del hotel
      </p>
    </form>

    <div class="login-prompt">
      <span>¿Ya tienes cuenta?</span>
      <NuxtLink to="/auth/login">Inicia sesión</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '~/stores/ui'
import { useAuthService } from '~/services/auth'
import { isValidEmail, isValidLength } from '~/utils/validators'

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

const router = useRouter()
const uiStore = useUIStore()
const authService = useAuthService()

const loading = ref(false)
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)
const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateField = (field: string) => {
  switch (field) {
    case 'name':
      errors.value.name = form.value.name.trim().length < 2 ? 'Ingresa tu nombre completo' : ''
      break
    case 'email':
      errors.value.email = !form.value.email
        ? 'El email es requerido'
        : !isValidEmail(form.value.email)
          ? 'Email inválido'
          : ''
      break
    case 'password':
      errors.value.password = !form.value.password
        ? 'La contraseña es requerida'
        : !isValidLength(form.value.password, 8, 128)
          ? 'Mínimo 8 caracteres'
          : ''
      break
    case 'confirmPassword':
      errors.value.confirmPassword = form.value.confirmPassword !== form.value.password
        ? 'Las contraseñas no coinciden'
        : ''
      break
  }
}

const isFormValid = computed(() => {
  return (
    form.value.email &&
    form.value.name.trim().length >= 2 &&
    form.value.password &&
    form.value.confirmPassword === form.value.password &&
    !errors.value.email &&
    !errors.value.password
  )
})

const handleRegister = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    await authService.register({
      name: form.value.name.trim(),
      email: form.value.email,
      password: form.value.password
    })
    await router.push('/dashboard')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear la cuenta'
    uiStore.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Si ya está autenticado, redirigir
  if (authService.isAuthenticated.value) router.push('/dashboard')
})
</script>

<style scoped>
.register-page {
  width: 100%;
}

.register-heading {
  margin-bottom: 20px;

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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;

  label {
    color: var(--panel-text);
    font-size: 13px;
    font-weight: 600;
  }
}

.input-shell {
  display: flex;
  min-width: 0;
  min-height: 46px;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
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
    height: 44px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--panel-text);
    font: inherit;
    font-size: 13px;

    &::placeholder {
      color: #9aa2b5;
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
  width: 32px;
  height: 32px;
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

.field-error {
  margin: 0;
  color: #b8443c;
  font-size: 12px;
}

.has-error .input-shell {
  border-color: #c45b51;
}

.register-submit {
  display: flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 2px;
  padding: 0 18px;
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
  margin: -7px 0 0;
  color: var(--panel-muted);
  font-size: 11px;
}

.login-prompt {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-top: 18px;
  padding-top: 15px;
  border-top: 1px solid var(--panel-border);
  color: var(--panel-muted);
  font-size: 12px;

  a {
    color: #5148e8;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      color: #3931c6;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

:global(.page-enter-active) {
  transition: all 300ms ease-out;
}

:global(.page-enter-from) {
  opacity: 0;
  transform: translateY(20px);
}
</style>