<template>
	<section class="mx-auto max-w-3xl space-y-6">
    <CPageHeader title="Nuevo huésped" description="Completa la información necesaria para su estancia." back-to="/clients" />
		<p v-if="errorMessage" role="alert" class="text-red-700">{{ errorMessage }}</p>
		<FClientForm class="form-surface" :loading="loading" @submit="saveClient" @cancel="router.back()" />
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
