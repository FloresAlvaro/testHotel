<template>
<!-- Tab: Notificaciones -->
    <CCard>
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
</template>

<script setup lang="ts">
const { notificationSettings, saveNotifications, resetNotifications } = useAdminSettingsContext();
</script>
