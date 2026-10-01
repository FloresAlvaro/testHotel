<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div class="flex items-center justify-center min-h-screen px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Logo y Título -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Crear cuenta</h1>
          <p class="text-slate-400">Acceso para el equipo del hotel</p>
        </div>

        <!-- Tarjeta de Login -->
        <CCard class="bg-slate-800 border-slate-700 shadow-2xl">
          <template #header-action>
            <button
              class="text-slate-400 hover:text-white transition-colors"
              @click="toggleTheme"
            >
              <Icon v-if="isDark" name="system-uicons:sun" size="20" />
              <Icon v-else name="system-uicons:moon" size="20" />
            </button>
          </template>

          <form class="space-y-4" @submit.prevent="handleLogin">
            <CInput
              v-model="form.name"
              label="Nombre completo"
              placeholder="Nombre y apellido"
              :error="errors.name"
              :disabled="loading"
              @blur="validateField('name')"
            />
            <!-- Email -->
            <CInput
              v-model="form.email"
              type="email"
              label="Correo Electrónico"
              placeholder="user@example.com"
              :error="errors.email"
              :disabled="loading"
              @blur="validateField('email')"
            />

            <!-- Contraseña -->
            <CInput
              v-model="form.password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              :error="errors.password"
              :disabled="loading"
              @blur="validateField('password')"
            />

            <CInput
              v-model="form.confirmPassword"
              type="password"
              label="Confirmar contraseña"
              placeholder="••••••••"
              :error="errors.confirmPassword"
              :disabled="loading"
              @blur="validateField('confirmPassword')"
            />

            <!-- Botón Login -->
            <CButton
              type="submit"
              variant="primary"
              class="w-full"
              :loading="loading"
              :disabled="loading || !isFormValid"
            >
              <Icon name="system-uicons:enter" size="18" class="mr-2" />
              Crear cuenta
            </CButton>
          </form>

          <!-- Registro -->
          <div class="mt-6 pt-6 border-t border-slate-700 text-center text-sm">
            <span class="text-slate-400">¿Ya tienes cuenta? </span>
            <NuxtLink
              to="/auth/login"
              class="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Inicia sesión
            </NuxtLink>
          </div>
        </CCard>

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-slate-500">
          <p>© 2026 Hotel Management System. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  </div>
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

const isDark = computed(() => uiStore.theme === 'dark')

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

const handleLogin = async () => {
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

const toggleTheme = () => {
  uiStore.toggleTheme()
}

onMounted(() => {
  // Si ya está autenticado, redirigir
  if (authService.isAuthenticated.value) router.push('/dashboard')
})
</script>

<style scoped>
/* Animación de entrada suave */
:global(.page-enter-active) {
  transition: all 300ms ease-out;
}

:global(.page-enter-from) {
  opacity: 0;
  transform: translateY(20px);
}
</style>