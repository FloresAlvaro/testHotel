import { onMounted, reactive, ref, watch } from 'vue'
import { useUIStore } from '~/stores/ui'
import { useApiClient } from '~/services/api'
import { useAuthStore } from '~/stores/auth'
import type { User, UserRole } from '~/types'

export const useAdminSettings = () => {
  const uiStore = useUIStore()
  const api = useApiClient()
  const authStore = useAuthStore()
  const route = useRoute()

  const activeTab = ref(typeof route.query.tab === 'string' ? route.query.tab : 'general')
  const isSaving = ref(false)
  const isBackingUp = ref(false)
  const isSavingPassword = ref(false)
  const isSavingUser = ref(false)
  const isUserModalOpen = ref(false)
  const isLoadingUsers = ref(false)
  const users = ref<User[]>([])
  const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const userForm = reactive<{ id: number | null; name: string; email: string; password: string; role: UserRole; is_active: boolean }>({
    id: null, name: '', email: '', password: '', role: 'receptionist', is_active: true
  })

  const defaultSettings = {
    hotel_name: 'Hotel Central La Paz', city: 'La Paz', email: 'info@hotelcentral.com',
    phone: '+591 2 123 4567', address: 'Calle Principal 123, Centro, La Paz',
    check_in_time: '15:00', check_out_time: '11:00', currency: 'Bs. (Bolivianos)', timezone: 'America/La_Paz'
  }
  const defaultNotifications = [
    { id: 'new-reservation', title: 'Nueva Reserva', description: 'Notificaciones cuando se crea una nueva reserva', email: true, push: true },
    { id: 'checkin', title: 'Check-in', description: 'Notificaciones cuando un huésped hace check-in', email: true, push: true },
    { id: 'payments', title: 'Pagos', description: 'Notificaciones de pagos completados', email: true, push: false },
    { id: 'maintenance', title: 'Mantenimiento', description: 'Notificaciones de habitaciones en mantenimiento', email: false, push: true }
  ]

  const tabs = [
    { id: 'general', label: 'General', icon: 'system-uicons:settings' },
    { id: 'users', label: 'Usuarios', icon: 'system-uicons:user' },
    { id: 'security', label: 'Seguridad', icon: 'system-uicons:lock' },
    { id: 'notifications', label: 'Notificaciones', icon: 'system-uicons:bell' },
    { id: 'backups', label: 'Respaldos', icon: 'system-uicons:save' }
  ]

  if (!tabs.some(item => item.id === activeTab.value)) activeTab.value = 'general'
  watch(() => route.query.tab, (tab) => {
    activeTab.value = typeof tab === 'string' && tabs.some(item => item.id === tab) ? tab : 'general'
  })

  const readPreference = <T>(key: string, fallback: T): T => {
    try {
      const value = localStorage.getItem(key)
      if (!value) return fallback
      const parsed: unknown = JSON.parse(value)
      if (Array.isArray(fallback) ? !Array.isArray(parsed) : !parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
      return parsed as T
    } catch {
      uiStore.warning('No se pudieron leer las preferencias locales. Se usarán los valores predeterminados.')
      return fallback
    }
  }

  const settings = ref({ ...defaultSettings })
  const notificationSettings = ref(defaultNotifications.map(item => ({ ...item })))
  interface BackupRecord { id: string; name: string; date: string; payload: string }
  const backupHistory = ref<BackupRecord[]>([])
  const lastBackup = computed(() => backupHistory.value[0]?.date || 'Todavía no hay exportaciones')
  const roleLabels: Record<UserRole, string> = { admin: 'Administrador', manager: 'Gerente', receptionist: 'Recepcionista' }

  const loadUsers = async () => {
    isLoadingUsers.value = true
    try {
      const response = await api.getUsers(1, 100)
      users.value = response.data || []
    } finally {
      isLoadingUsers.value = false
    }
  }

  const saveSettings = async () => {
    isSaving.value = true
    try {
      localStorage.setItem('hotel-settings', JSON.stringify(settings.value))
      uiStore.success('Preferencias guardadas en este navegador')
    } catch {
      uiStore.error('No se pudieron guardar las preferencias locales')
    } finally {
      isSaving.value = false
    }
  }

  const resetChanges = () => {
    settings.value = { ...defaultSettings, ...readPreference('hotel-settings', defaultSettings) }
    uiStore.info('Se restauraron las preferencias guardadas')
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
    notificationSettings.value = readPreference('hotel-notifications', defaultNotifications.map(item => ({ ...item })))
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

  const saveUser = async () => {
    const normalizedName = userForm.name.trim()
    const normalizedEmail = userForm.email.trim()
    if (normalizedName.length < 2 || normalizedName.length > 200) {
      uiStore.error('El nombre debe tener entre 2 y 200 caracteres')
      return
    }
    if (normalizedEmail.length > 200) {
      uiStore.error('El correo electrónico no puede superar los 200 caracteres')
      return
    }
    if (!userForm.id && (userForm.password.length < 8 || userForm.password.length > 128)) {
      uiStore.error('La contraseña inicial debe tener entre 8 y 128 caracteres')
      return
    }

    isSavingUser.value = true
    try {
      if (userForm.id) {
        await api.updateUser(userForm.id, { name: normalizedName, email: normalizedEmail, role: userForm.role, is_active: userForm.is_active })
      } else {
        await api.register({ name: normalizedName, email: normalizedEmail, password: userForm.password })
      }
      await loadUsers()
      isUserModalOpen.value = false
      uiStore.success('Usuario guardado')
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
    settings.value = { ...defaultSettings, ...readPreference('hotel-settings', defaultSettings) }
    notificationSettings.value = readPreference('hotel-notifications', defaultNotifications.map(item => ({ ...item })))
    backupHistory.value = readPreference<BackupRecord[]>('hotel-settings-exports', [])
    loadUsers().catch(() => uiStore.error('No se pudo cargar la lista de usuarios'))
  })

  return { roleLabels, uiStore, api, authStore, route, activeTab, isSaving, isBackingUp, isSavingPassword, isSavingUser, isUserModalOpen, isLoadingUsers, users, passwordForm, userForm, defaultSettings, defaultNotifications, tabs, settings, notificationSettings, backupHistory, lastBackup, loadUsers, saveSettings, resetChanges, createBackup, downloadBackup, removeBackup, saveNotifications, resetNotifications, changePassword, openCreateUser, openEditUser, saveUser, toggleUserActive };
};

export const useAdminSettingsContext = () => {
  const context = inject<ReturnType<typeof useAdminSettings>>('admin-settings');
  if (!context) throw new Error('Las pestañas requieren el contexto de configuración');
  return context;
};
