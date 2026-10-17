<template>
  <div class="space-y-6">
    <!-- Header -->
    <CPageHeader :title="activeTab === 'users' ? 'Equipo' : 'Configuración'" :description="activeTab === 'users' ? 'Personas, roles y accesos de tu hotel.' : 'Preferencias y opciones de tu espacio de trabajo.'" />

    <!-- Navegación de Pestañas -->
    <div class="border-b border-slate-200 dark:border-slate-700">
      <div class="settings-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'settings-tab',
            activeTab === tab.id
              ? 'is-selected'
              : ''
          ]"
          :aria-pressed="activeTab === tab.id" @click="selectTab(tab.id)"
        >
          <Icon :name="tab.icon" size="18" class="inline mr-2" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Contenido de Pestañas -->

    <!-- Tab: General -->
    <CCard v-if="activeTab === 'general'">
      <fieldset class="space-y-6" :disabled="!settingsLoaded || isSaving">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Información General
          </h2>
          <p class="mb-4 text-sm text-amber-800 dark:text-amber-200">
            Los cambios se guardan en el servidor y se comparten con todo el equipo.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CInput
              v-model="settings.hotel_name"
              label="Nombre del Hotel"
              placeholder="Hotel Central"
            />
            <CInput
              v-model="settings.city"
              label="Ciudad"
              placeholder="La Paz"
            />
            <CInput
              v-model="settings.email"
              type="email"
              label="Email de Contacto"
              placeholder="info@hotel.com"
            />
            <CInput
              v-model="settings.phone"
              type="tel"
              label="Teléfono"
              placeholder="+591 2 123 4567"
            />
            <div class="md:col-span-2">
              <label class="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">
                Dirección
              </label>
              <textarea
                v-model="settings.address"
                placeholder="Calle Principal 123, La Paz"
                class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Configuración de Operación
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CInput
              v-model="settings.check_in_time"
              type="time"
              label="Hora de Check-in"
            />
            <CInput
              v-model="settings.check_out_time"
              type="time"
              label="Hora de Check-out"
            />
            <label class="flex flex-col gap-2 text-sm">Moneda
              <select v-model="settings.currency" class="operation-filter"><option value="BOB">BOB · Boliviano</option><option value="USD">USD · Dólar</option><option value="EUR">EUR · Euro</option></select>
            </label>
            <CInput
              v-model="settings.timezone"
              label="Zona Horaria"
              placeholder="America/La_Paz"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-6">
          <CButton variant="secondary" @click="resetChanges">
            Recargar configuración
          </CButton>
          <CButton variant="primary" :loading="isSaving" :disabled="!settingsLoaded" @click="saveSettings">
            <Icon name="system-uicons:check" size="18" class="mr-2" />
            Guardar Cambios
          </CButton>
        </div>
      </fieldset>
    </CCard>

    <!-- Tab: Usuarios -->
    <CCard v-if="activeTab === 'users'">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Gestión de Usuarios
          </h2>
          <CButton variant="primary" size="sm" @click="openCreateUser">
            <Icon name="system-uicons:user-add" size="16" class="mr-2" />
            Invitar persona
          </CButton>
        </div>

        <CInvitationList :key="invitationsVersion" />
        <div class="overflow-x-auto" tabindex="0" role="region" aria-label="Resultados">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Usuario
                </th>
                <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Email
                </th>
                <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Rol
                </th>
                <th scope="col" class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Estado
                </th>
                <th scope="col" class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-white">
                  {{ user.name }}
                </td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {{ user.email }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {{ roleLabels[user.role] }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span
                    :class="user.is_active ? 'text-green-600' : 'text-red-600'"
                    class="font-medium"
                  >
                    {{ user.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <CButton variant="ghost" size="sm" aria-label="Editar usuario" @click="openEditUser(user)">
                      <Icon name="system-uicons:write" size="16" />
                    </CButton>
                    <CButton
                      variant="ghost"
                      size="sm"
                      :disabled="user.id === authStore.user?.id || isSavingUser"
                      :class="user.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'"
                      :aria-label="user.is_active ? 'Desactivar usuario' : 'Activar usuario'"
                      @click="toggleUserActive(user)"
                    >
                      <Icon :name="user.is_active ? 'system-uicons:lock' : 'system-uicons:lock-open'" size="16" />
                    </CButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </CCard>

    <!-- Tab: Seguridad -->
    <CCard v-if="activeTab === 'security'">
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Seguridad y Privacidad
          </h2>

          <div class="space-y-4">
            <!-- Cambiar Contraseña -->
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <h3 class="font-medium text-slate-900 dark:text-white mb-3">
                Cambiar Contraseña
              </h3>
              <div class="space-y-3">
                <CInput
                  v-model="passwordForm.currentPassword"
                  type="password"
                  label="Contraseña Actual"
                  placeholder="••••••••"
                />
                <CInput
                  v-model="passwordForm.newPassword"
                  type="password"
                  label="Nueva Contraseña"
                  placeholder="••••••••"
                />
                <CInput
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  label="Confirmar Contraseña"
                  placeholder="••••••••"
                />
                <CButton variant="primary" :loading="isSavingPassword" @click="changePassword">
                  <Icon name="system-uicons:check" size="18" class="mr-2" />
                  Cambiar Contraseña
                </CButton>
              </div>
            </div>

            <!-- Autenticación de Dos Factores -->
            <div class="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-slate-900 dark:text-white">
                    Autenticación de Dos Factores
                  </h3>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    La verificación en dos pasos todavía no está disponible.
                  </p>
                </div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 rounded border-slate-300" disabled aria-label="Autenticación de dos factores no disponible" >
                </label>
              </div>
            </div>

            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <h3 class="font-medium text-slate-900 dark:text-white mb-3">
                Sesiones Activas
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">La consulta y el cierre de otras sesiones todavía no están disponibles.</p>
            </div>
          </div>
        </div>

      </div>
    </CCard>

    <!-- Tab: Notificaciones -->
    <CCard v-if="activeTab === 'notifications'">
      <div class="space-y-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Preferencias de Notificaciones
        </h2>

        <div class="space-y-4">
          <div
            v-for="notification in notificationSettings"
            :key="notification.id"
            class="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <div>
              <h3 class="font-medium text-slate-900 dark:text-white">
                {{ notification.title }}
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {{ notification.description }}
              </p>
            </div>
            <div class="flex gap-2">
              <label class="flex items-center gap-2">
                <input
                  v-model="notification.email"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-300"
                >
                <span class="text-sm text-slate-600 dark:text-slate-400">Email</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="notification.push"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-300"
                >
                <span class="text-sm text-slate-600 dark:text-slate-400">Push</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-6">
          <CButton variant="secondary" @click="resetNotifications">
            Cancelar
          </CButton>
          <CButton variant="primary" @click="saveNotifications">
            <Icon name="system-uicons:check" size="18" class="mr-2" />
            Guardar Preferencias
          </CButton>
        </div>
      </div>
    </CCard>

    <!-- Tab: Respaldos -->
    <CCard v-if="activeTab === 'backups'">
      <div class="space-y-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Exportaciones locales
        </h2>
        <p class="text-sm text-amber-800 dark:text-amber-200">
          Estas exportaciones incluyen la configuración y las preferencias de notificaciones; no incluyen reservas, huéspedes ni pagos.
        </p>

        <div class="space-y-4">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h3 class="font-medium text-blue-900 dark:text-blue-200">
              Última Exportación
            </h3>
            <p class="text-sm text-blue-800 dark:text-blue-300 mt-1">
              {{ lastBackup }}
            </p>
            <CButton variant="secondary" size="sm" class="mt-3" :disabled="backupHistory.length === 0" @click="downloadBackup(backupHistory[0]?.id)">
              <Icon name="system-uicons:download" size="16" class="mr-2" />
              Descargar
            </CButton>
          </div>

          <div class="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h3 class="font-medium text-slate-900 dark:text-white">
              Exportar Preferencias
            </h3>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Descarga configuración y preferencias de notificaciones en JSON.
            </p>
            <CButton
              variant="primary"
              size="sm"
              class="mt-3"
              :loading="isBackingUp"
              @click="createBackup"
            >
              <Icon name="system-uicons:plus" size="16" class="mr-2" />
              Exportar JSON
            </CButton>
          </div>

          <div class="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <h3 class="font-medium text-slate-900 dark:text-white mb-3">
              Historial de Respaldos
            </h3>
            <div class="space-y-2">
              <div
                v-for="backup in backupHistory"
                :key="backup.id"
                class="flex items-center justify-between text-sm"
              >
                <div>
                  <p class="font-medium text-slate-900 dark:text-white">
                    {{ backup.name }}
                  </p>
                  <p class="text-slate-600 dark:text-slate-400">
                    {{ backup.date }}
                  </p>
                </div>
                <div class="flex gap-2">
                  <CButton variant="ghost" size="sm" aria-label="Descargar exportación" @click="downloadBackup(backup.id)">
                    <Icon name="system-uicons:download" size="16" />
                  </CButton>
                  <CButton variant="ghost" size="sm" aria-label="Eliminar registro" @click="removeBackup(backup.id)">
                    <Icon name="system-uicons:trash" size="16" />
                  </CButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CCard>

    <CModal :is-open="isUserModalOpen" :title="userForm.id ? 'Editar usuario' : 'Invitar persona'" size="md" @close="isUserModalOpen = false">
      <form class="space-y-4" @submit.prevent="saveUser">
        <CInput v-model="userForm.name" label="Nombre" required />
        <CInput v-model="userForm.email" type="email" label="Email" required />
        <p v-if="!userForm.id" class="text-sm">Recibirá un enlace por correo para elegir su contraseña. La invitación vence en 48 horas.</p>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Rol
          <select v-model="userForm.role" class="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="receptionist">Recepcionista</option>
          </select>
        </label>
        <p class="text-sm text-slate-600 dark:text-slate-400">Solo los administradores pueden crear cuentas del personal.</p>
        <div class="flex justify-end gap-2 pt-3">
          <CButton type="button" variant="secondary" @click="isUserModalOpen = false">Cancelar</CButton>
          <CButton type="submit" variant="primary" :loading="isSavingUser">Guardar</CButton>
        </div>
      </form>
    </CModal>
  </div>
</template>

<script setup lang="ts">
import type { StaffInvitationInput } from '~/types/generated/api'
import { onMounted, reactive, ref, watch } from 'vue'
import { useUIStore } from '~/stores/ui'
import { useApiClient } from '~/services/api'
import { useAuthStore } from '~/stores/auth'
import type { User, UserRole } from '~/types'

definePageMeta({
  middleware: ['auth', 'admin']
})

const uiStore = useUIStore()
const api = useApiClient()
const authStore = useAuthStore()
const route = useRoute()

const activeTab = ref(route.query.tab === 'users' ? 'users' : 'general')
const isSaving = ref(false)
const settingsLoaded = ref(false)
const isBackingUp = ref(false)
const isSavingPassword = ref(false)
const isSavingUser = ref(false)
const isUserModalOpen = ref(false)
const users = ref<User[]>([])
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const userForm = reactive<{ id: number | null; name: string; email: string; password: string; role: UserRole; is_active: boolean }>({
  id: null, name: '', email: '', password: '', role: 'receptionist', is_active: true
})

const defaultSettings = {
  hotel_name: 'Hotel Central La Paz', city: 'La Paz', email: 'info@hotelcentral.com',
  phone: '+591 2 123 4567', address: 'Calle Principal 123, Centro, La Paz',
  check_in_time: '15:00', check_out_time: '11:00', currency: 'BOB', timezone: 'America/La_Paz', version: 1
}
const defaultNotifications = [
  { id: 'new-reservation', title: 'Nueva Reserva', description: 'Notificaciones cuando se crea una nueva reserva', email: true, push: true },
  { id: 'checkin', title: 'Check-in', description: 'Notificaciones cuando un huésped hace check-in', email: true, push: true },
  { id: 'payments', title: 'Pagos', description: 'Notificaciones de pagos completados', email: true, push: false },
  { id: 'maintenance', title: 'Mantenimiento', description: 'Notificaciones de habitaciones en mantenimiento', email: false, push: true }
]

const tabs = [
  { id: 'general', label: 'General', icon: 'system-uicons:settings' },
  { id: 'users', label: 'Equipo', icon: 'system-uicons:user' },
  { id: 'security', label: 'Seguridad', icon: 'system-uicons:lock' },
  { id: 'notifications', label: 'Notificaciones', icon: 'system-uicons:bell' },
  { id: 'backups', label: 'Respaldos', icon: 'system-uicons:floppy' }
]

watch(() => route.query.tab, (tab) => {
  activeTab.value = typeof tab === 'string' && tabs.some(item => item.id === tab) ? tab : 'general'
}, { immediate: true })

const selectTab = (tab: string) => navigateTo({ path: '/admin/settings', query: tab === 'general' ? {} : { tab } })

const hotel = useHotelSettings()
const settings = ref({ ...defaultSettings })
const notificationSettings = ref(defaultNotifications.map(item => ({ ...item })))
interface BackupRecord { id: string; name: string; date: string; payload: string }
const backupHistory = ref<BackupRecord[]>([])
const lastBackup = computed(() => backupHistory.value[0]?.date || 'Todavía no hay exportaciones')
const roleLabels: Record<UserRole, string> = { admin: 'Administrador', manager: 'Gerente', receptionist: 'Recepcionista', customer: 'Huésped' }

const loadUsers = async () => {
  const response = await api.getUsers(1, 100)
  users.value = response.data || []
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    settings.value = { ...await hotel.save(settings.value) }
    uiStore.success('Configuración compartida guardada')
  } catch (e: unknown) {
    const failure = e as { data?: { message?: string } }
    uiStore.error(failure.data?.message || 'No se pudo guardar la configuración')
  } finally { isSaving.value = false }
}
const resetChanges = async () => {
  try { settings.value = { ...await hotel.load() }; settingsLoaded.value = true }
  catch { uiStore.error('No se pudo cargar la configuración') }
}

const createBackup = async () => {
  isBackingUp.value = true
  try {
    const payload = JSON.stringify({ settings: settings.value, notifications: notificationSettings.value }, null, 2)
    const id = crypto.randomUUID()
    const record: BackupRecord = { id, name: 'Exportación local de preferencias', date: new Date().toLocaleString('es-BO'), payload }
    backupHistory.value.unshift(record)
    localStorage.setItem('hotel-settings-exports', JSON.stringify(backupHistory.value.slice(0, 10)))
    downloadBackup(id)
    uiStore.success('Se exportaron las preferencias de este navegador')
  } catch {
    uiStore.error('No se pudo crear la exportación local')
  } finally {
    isBackingUp.value = false
  }
}

const downloadBackup = (id?: string) => {
  const record = backupHistory.value.find(item => item.id === id)
  if (!record) return
  const url = URL.createObjectURL(new Blob([record.payload], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `preferencias-hotel-${record.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const removeBackup = (id: string) => {
  backupHistory.value = backupHistory.value.filter(item => item.id !== id)
  localStorage.setItem('hotel-settings-exports', JSON.stringify(backupHistory.value))
}

const saveNotifications = () => {
  localStorage.setItem('hotel-notifications', JSON.stringify(notificationSettings.value))
  uiStore.success('Preferencias de notificación guardadas en este navegador')
}

const resetNotifications = () => {
  const saved = localStorage.getItem('hotel-notifications')
  notificationSettings.value = saved ? JSON.parse(saved) : defaultNotifications.map(item => ({ ...item }))
}

const changePassword = async () => {
  if (!authStore.user || passwordForm.newPassword.length < 8 || passwordForm.newPassword !== passwordForm.confirmPassword) {
    uiStore.error('Revisa la contraseña nueva y su confirmación')
    return
  }
  isSavingPassword.value = true
  try {
    await api.changePassword(authStore.user.id, { ...passwordForm })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    uiStore.success('Contraseña actualizada')
  } catch (error) {
    uiStore.error(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña')
  } finally {
    isSavingPassword.value = false
  }
}

const openCreateUser = () => {
  Object.assign(userForm, { id: null, name: '', email: '', password: '', role: 'receptionist', is_active: true })
  isUserModalOpen.value = true
}

const openEditUser = (user: User) => {
  Object.assign(userForm, { id: user.id, name: user.name, email: user.email, password: '', role: user.role, is_active: user.is_active })
  isUserModalOpen.value = true
}

const invitationsVersion=ref(0)
const saveUser = async () => {
  isSavingUser.value = true
  try {
    if (userForm.id) {
      await api.updateUser(userForm.id, { name: userForm.name, email: userForm.email, role: userForm.role, is_active: userForm.is_active })
    } else {
      if(userForm.role==='customer') throw new Error('Invita huéspedes desde su ficha')
      const body:StaffInvitationInput={name:userForm.name,email:userForm.email,role:userForm.role}
      await api.request('/users/invitations', {method:'POST', body, retry:0})
      invitationsVersion.value++
    }
    await loadUsers()
    isUserModalOpen.value = false
    uiStore.success(userForm.id ? 'Usuario guardado' : 'Invitación enviada a la cola de correo')
  } catch (error) {
    uiStore.error(error instanceof Error ? error.message : 'No se pudo guardar el usuario')
  } finally {
    isSavingUser.value = false
  }
}

const toggleUserActive = async (user: User) => {
  try {
    await api.setUserActive(user.id, !user.is_active)
    await loadUsers()
    uiStore.success(user.is_active ? 'Usuario desactivado' : 'Usuario activado')
  } catch (error) {
    uiStore.error(error instanceof Error ? error.message : 'No se pudo actualizar el usuario')
  }
}

onMounted(() => {
  const storedNotifications = localStorage.getItem('hotel-notifications')
  const storedBackups = localStorage.getItem('hotel-settings-exports')
  resetChanges()
  if (storedNotifications) notificationSettings.value = JSON.parse(storedNotifications)
  if (storedBackups) backupHistory.value = JSON.parse(storedBackups)
  loadUsers().catch(() => uiStore.error('No se pudo cargar la lista de usuarios'))
})
</script>