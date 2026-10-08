<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
        Configuración
      </h1>
      <p class="text-slate-600 dark:text-slate-400 mt-1">
        Preferencias locales y administración de cuentas
      </p>
    </div>

    <!-- Navegación de Pestañas -->
    <div class="border-b border-slate-200 dark:border-slate-700">
      <div class="flex gap-4 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            'shrink-0 pb-4 px-4 font-medium transition-colors border-b-2',
            activeTab === tab.id
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
          ]"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" size="18" class="inline mr-2" />
          {{ tab.label }}
        </button>
      </div>
    </div>

    <SettingsGeneral v-if="activeTab === 'general'" />
    <SettingsUsers v-if="activeTab === 'users'" />
    <SettingsSecurity v-if="activeTab === 'security'" />
    <SettingsNotifications v-if="activeTab === 'notifications'" />
    <SettingsBackups v-if="activeTab === 'backups'" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });
const context = useAdminSettings();
provide('admin-settings', context);
const { activeTab, tabs } = context;
</script>
