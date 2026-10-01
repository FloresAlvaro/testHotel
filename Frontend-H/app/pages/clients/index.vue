<template>
	<section class="space-y-6">
		<header class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
				<p class="mt-1 text-slate-600 dark:text-slate-400">Huéspedes registrados</p>
			</div>
			<NuxtLink
				to="/clients/create"
				class="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
			>
				Registrar cliente
			</NuxtLink>
		</header>

		<label class="block max-w-md">
			<span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Buscar</span>
			<input
				v-model="query"
				type="search"
				placeholder="Nombre, documento, email o teléfono"
				class="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
			>
		</label>

		<p v-if="errorMessage" role="alert" class="text-red-700">{{ errorMessage }}</p>
		<div v-else class="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
			<table class="w-full text-left">
				<thead class="bg-slate-50 dark:bg-slate-800">
					<tr>
						<th class="px-4 py-3">Nombre</th>
						<th class="px-4 py-3">Documento</th>
						<th class="px-4 py-3">Contacto</th>
						<th class="px-4 py-3">Acción</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 dark:divide-slate-700">
					<tr v-for="client in visibleClients" :key="client.id">
						<td class="px-4 py-3">{{ client.name }}</td>
						<td class="px-4 py-3">{{ client.document }}</td>
						<td class="px-4 py-3">{{ client.email || client.phone || 'Sin contacto' }}</td>
						<td class="px-4 py-3">
							<NuxtLink :to="`/clients/${client.id}`" class="text-blue-700 hover:underline">Ver ficha</NuxtLink>
						</td>
					</tr>
					<tr v-if="!loading && visibleClients.length === 0">
						<td colspan="4" class="px-4 py-8 text-center text-slate-500">No hay clientes para mostrar.</td>
					</tr>
					<tr v-if="loading">
						<td colspan="4" class="px-4 py-8 text-center text-slate-500">Cargando clientes…</td>
					</tr>
				</tbody>
			</table>
		</div>

		<nav v-if="pagination.totalPages > 1" class="flex items-center justify-end gap-3" aria-label="Paginación">
			<button
				class="rounded border px-3 py-2 disabled:opacity-50"
				:disabled="loading || pagination.page <= 1"
				@click="loadPage(pagination.page - 1)"
			>Anterior</button>
			<span>Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
			<button
				class="rounded border px-3 py-2 disabled:opacity-50"
				:disabled="loading || pagination.page >= pagination.totalPages"
				@click="loadPage(pagination.page + 1)"
			>Siguiente</button>
		</nav>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

definePageMeta({ middleware: ['auth', 'receptionist'] });

const { clients, loading, pagination, fetchClients } = useClients();
const query = ref('');
const errorMessage = ref('');

const visibleClients = computed(() => {
	const search = query.value.trim().toLowerCase();
	if (!search) return clients.value;
	return clients.value.filter((client) =>
		[client.name, client.document, client.email, client.phone]
			.some((value) => value?.toLowerCase().includes(search))
	);
});

const loadPage = async (page: number) => {
	errorMessage.value = '';
	try {
		await fetchClients(page, pagination.value.pageSize);
	} catch {
		errorMessage.value = 'No se pudo cargar la lista de clientes.';
	}
};

onMounted(() => loadPage(1));
</script>
