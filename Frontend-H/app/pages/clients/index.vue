<template>
	<section class="space-y-6">
    <CPageHeader title="Huéspedes" description="Los datos de tus clientes, en un solo lugar.">
      <NuxtLink to="/clients/create" class="button-link"><Icon name="system-uicons:plus" />Nuevo huésped</NuxtLink>
    </CPageHeader>

		<label class="block max-w-md">
			<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</span>
			<input
				v-model="query"
				type="search"
				placeholder="Nombre, documento, email o teléfono"
				class="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
			>
		</label>

		<p v-if="errorMessage" role="alert" class="operation-error">{{ errorMessage }} <button class="underline" @click="loadPage">Reintentar</button></p>
    <CTableHint />
		<div v-if="!errorMessage" tabindex="0" role="region" aria-label="Huéspedes" class="guest-table overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
			<table class="table-data-centered w-full text-left">
				<thead class="bg-slate-50 dark:bg-slate-800">
					<tr>
						<th scope="col" class="px-4 py-3">Nombre</th>
						<th scope="col" class="px-4 py-3">Documento</th>
						<th scope="col" class="px-4 py-3">Contacto</th>
						<th scope="col" class="px-4 py-3">Acción</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 dark:divide-slate-700">
					<tr v-for="client in visibleClients" :key="client.id">
						<td class="px-4 py-3">{{ client.name }}</td>
						<td class="px-4 py-3">{{ client.document }}</td>
						<td class="px-4 py-3"><div v-if="client.email"><a :href="`mailto:${client.email}`">{{ client.email }}</a></div><div v-if="client.phone"><a :href="`tel:${client.phone}`">{{ client.phone }}</a></div><span v-if="!client.email && !client.phone">Sin contacto</span></td>
						<td class="px-4 py-3">
							<NuxtLink :to="`/clients/${client.id}`" class="text-blue-700 hover:underline">Ver ficha</NuxtLink>
						</td>
					</tr>
					<tr v-if="!loading && visibleClients.length === 0">
						<td colspan="4" class="px-4 py-8 text-center text-slate-500">{{ query ? 'No se encontraron huéspedes con esta búsqueda.' : 'Aún no hay huéspedes registrados.' }}</td>
					</tr>
					<tr v-if="loading">
						<td colspan="4" class="px-4 py-8 text-center text-slate-500">Cargando clientes…</td>
					</tr>
				</tbody>
			</table>
		</div>

    <CTablePagination :pagination="pagination" :loading="loading" @change="page=$event" />
	</section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({ middleware: ['auth', 'receptionist'] });

const query=ref('')
const {rows:visibleClients,loading,error:errorMessage,pagination,page,load:loadPage}=useTableList<import('~/types').Client>('/clients',()=>({q:query.value.trim()}))
</script>
