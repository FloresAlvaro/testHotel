<template>
<!-- Tab: Seguridad -->
    <CCard>
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

            <AccountSessions />
            <!-- Autenticación de Dos Factores -->
            <div class="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="font-medium text-slate-900 dark:text-white">
                    Autenticación de Dos Factores
                  </h3>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    La API no ofrece configuración de autenticación de dos factores.
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
              <p class="text-sm text-slate-600 dark:text-slate-400">La API no expone información ni revocación de sesiones.</p>
            </div>
          </div>
        </div>

      </div>
    </CCard>
</template>

<script setup lang="ts">
const { isSavingPassword, passwordForm, changePassword } = useAdminSettingsContext();
</script>
