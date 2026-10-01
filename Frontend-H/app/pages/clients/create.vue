<template>
	<section class="mx-auto max-w-3xl space-y-6">
		<header>
			<NuxtLink to="/clients" class="text-sm text-blue-700 hover:underline">← Volver a clientes</NuxtLink>
			<h1 class="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Registrar cliente</h1>
		</header>
		<p v-if="errorMessage" role="alert" class="text-red-700">{{ errorMessage }}</p>
		<FClientForm :loading="loading" @submit="saveClient" @cancel="router.back()" />
	</section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CreateClientRequest } from '~/types';

definePageMeta({ middleware: ['auth', 'receptionist'] });

const router = useRouter();
const { createClient } = useClients();
const loading = ref(false);
const errorMessage = ref('');

const saveClient = async (data: CreateClientRequest) => {
	loading.value = true;
	errorMessage.value = '';
	try {
		await createClient(data);
		await router.push('/clients');
	} catch {
		errorMessage.value = 'No se pudo registrar el cliente. Revisa los datos e inténtalo nuevamente.';
	} finally {
		loading.value = false;
	}
};
</script>
