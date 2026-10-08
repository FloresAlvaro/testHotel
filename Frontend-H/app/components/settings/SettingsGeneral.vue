<template>
<!-- Tab: General -->
    <CCard>
      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Información General
          </h2>
          <p class="mb-4 text-sm text-amber-800 dark:text-amber-200">
            Estos datos se guardan en este navegador. La API todavía no ofrece ajustes globales del hotel.
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
            <CInput
              v-model="settings.currency"
              label="Moneda"
              placeholder="Bs. (Bolivianos)"
            />
            <CInput
              v-model="settings.timezone"
              label="Zona Horaria"
              placeholder="America/La_Paz"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-6">
          <CButton variant="secondary" @click="resetChanges">
            Cancelar
          </CButton>
          <CButton variant="primary" :loading="isSaving" @click="saveSettings">
            <Icon name="system-uicons:check" size="18" class="mr-2" />
            Guardar Cambios
          </CButton>
        </div>
      </div>
    </CCard>
</template>

<script setup lang="ts">
const { isSaving, settings, saveSettings, resetChanges } = useAdminSettingsContext();
</script>
