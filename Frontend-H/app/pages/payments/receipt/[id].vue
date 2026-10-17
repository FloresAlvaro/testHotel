<template><div class="space-y-6"><div class="receipt-controls"><CPageHeader title="Comprobante de pago" description="Comprobante interno. No sustituye una factura fiscal." /><div class="flex gap-2"><NuxtLink :to="`/payments/${route.params.id}`" class="btn btn-secondary">Volver al pago</NuxtLink><CButton :disabled="!receipt" @click="print">Imprimir</CButton></div></div><p v-if="error" role="alert" class="operation-error">{{ error }}</p><CReceipt v-if="receipt" :receipt="receipt" /></div></template>
<script setup lang="ts">
import type { Receipt } from '~/types/operations'
definePageMeta({middleware:'auth'})
const route=useRoute(),{get,run,error}=useOperations(),receipt=ref<Receipt>()
const print=()=>window.print()
onMounted(()=>run(async()=>{receipt.value=(await get<Receipt>(`receipts/${route.params.id}`)).data}))
</script>
