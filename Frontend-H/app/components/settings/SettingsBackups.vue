<template>
<!-- Tab: Respaldos -->
    <CCard>
      <div class="space-y-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Exportaciones locales
        </h2>
        <p class="text-sm text-amber-800 dark:text-amber-200">
          Estas exportaciones contienen solo preferencias del navegador. Los respaldos de PostgreSQL se gestionan desde los comandos del servidor, con verificación de restauración en una base aislada.
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
</template>

<script setup lang="ts">
const { isBackingUp, backupHistory, lastBackup, createBackup, downloadBackup, removeBackup } = useAdminSettingsContext();
</script>
