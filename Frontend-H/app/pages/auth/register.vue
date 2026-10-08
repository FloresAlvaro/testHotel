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
import { getDefaultRouteForRole } from '~/utils/authRoutes'
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
    await router.push(getDefaultRouteForRole(authService.user.value?.role))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear la cuenta'
    uiStore.error(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Si ya está autenticado, redirigir
  if (authService.isAuthenticated.value) {
    router.push(getDefaultRouteForRole(authService.user.value?.role))
  }
})
</script>

<style scoped src="~/assets/styles/pages/auth/register.css"></style>