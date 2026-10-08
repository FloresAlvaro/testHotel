<template>
<!-- Tab: Usuarios -->
    <CCard>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Gestión de Usuarios
          </h2>
          <CButton variant="primary" size="sm" @click="openCreateUser">
            <Icon name="system-uicons:user-add" size="16" class="mr-2" />
            Crear usuario
          </CButton>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Usuario
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Email
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Rol
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Estado
                </th>
                <th class="text-center py-3 px-4 font-semibold text-slate-900 dark:text-white">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              <tr v-if="isLoadingUsers">
                <td colspan="5" class="py-8 px-4 text-center text-slate-500 dark:text-slate-400">
                  Cargando usuarios...
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="5" class="py-8 px-4 text-center text-slate-500 dark:text-slate-400">
                  No hay usuarios para mostrar.
                </td>
              </tr>
              <template v-else>
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
                      <CButton variant="ghost" size="sm" :aria-label="`Editar usuario ${user.name}`" @click="openEditUser(user)">
                        <Icon name="system-uicons:edit" size="16" />
                        <span>Editar</span>
                      </CButton>
                      <CButton
                        variant="ghost"
                        size="sm"
                        :disabled="user.id === authStore.user?.id || isSavingUser"
                        :class="user.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'"
                        :aria-label="`${user.is_active ? 'Desactivar' : 'Activar'} usuario ${user.name}`"
                        @click="toggleUserActive(user)"
                      >
                        <Icon :name="user.is_active ? 'system-uicons:lock' : 'system-uicons:unlock'" size="16" />
                        <span>{{ user.is_active ? 'Desactivar' : 'Activar' }}</span>
                      </CButton>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </CCard>
<CModal :is-open="isUserModalOpen" :title="userForm.id ? 'Editar usuario' : 'Crear usuario'" size="md" @close="isUserModalOpen = false">
      <form class="space-y-4" @submit.prevent="saveUser">
        <CInput v-model="userForm.name" label="Nombre completo" placeholder="Ej. Ana Pérez" required hint="Debe tener al menos 2 caracteres." />
        <CInput v-model="userForm.email" type="email" label="Correo electrónico" placeholder="nombre@hotel.com" required />
        <CInput
          v-if="!userForm.id"
          v-model="userForm.password"
          type="password"
          label="Contraseña inicial"
          placeholder="Mínimo 8 caracteres"
          required
          hint="Comparte esta contraseña inicial de forma segura con el usuario."
        />
        <label v-if="userForm.id" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Rol
          <select v-model="userForm.role" class="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="receptionist">Recepcionista</option>
          </select>
        </label>
        <p v-else class="text-sm text-slate-600 dark:text-slate-400">Las cuentas nuevas se crean con el rol de Recepcionista. Puedes cambiar el rol después de crear la cuenta.</p>
        <div class="flex justify-end gap-2 pt-3">
          <CButton type="button" variant="secondary" @click="isUserModalOpen = false">Cancelar</CButton>
          <CButton type="submit" variant="primary" :loading="isSavingUser">{{ userForm.id ? 'Guardar cambios' : 'Crear usuario' }}</CButton>
        </div>
      </form>
    </CModal>
</template>

<script setup lang="ts">
const { roleLabels, authStore, isSavingUser, isUserModalOpen, isLoadingUsers, users, userForm, openCreateUser, openEditUser, saveUser, toggleUserActive } = useAdminSettingsContext();
</script>
