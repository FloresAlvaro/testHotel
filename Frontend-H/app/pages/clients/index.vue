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

        <CTable
:columns="columns" :rows="visibleClients" :loading="loading" :error="errorMessage"
          :pagination="pagination" :show-pagination="true"
          @prev-page="loadPage(pagination.page - 1)" @next-page="loadPage(pagination.page + 1)">
          <template #cell-contact="{ row }">{{ row.email || row.phone || 'Sin contacto' }}</template>
          <template #actions="{ row }"><NuxtLink :to="`/clients/${row.id}`" class="text-blue-700 hover:underline">Ver ficha</NuxtLink></template>
        </CTable>
	</section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

definePageMeta({ middleware: ['auth', 'receptionist'] });

const { clients, loading, pagination, fetchClients } = useClients();
const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'document', label: 'Documento' },
  { key: 'contact', label: 'Contacto' },
];
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
