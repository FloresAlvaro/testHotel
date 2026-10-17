<template><div class="space-y-6"><div class="receipt-controls"><CPageHeader title="Mi comprobante" description="Comprobante interno del hotel. No sustituye una factura fiscal." :back-to="receipt?`/portal/reservations/${receipt.snapshot.reservation_id}`:'/portal'" /><CButton :disabled="!receipt" @click="print">Imprimir</CButton></div><p v-if="error" role="alert" class="operation-error">{{ error }}</p><p v-if="loading" role="status">Cargando comprobante…</p><CReceipt v-else-if="receipt" :receipt="receipt" /></div></template>
<script setup lang="ts">
import type { Receipt } from '~/types/operations'
definePageMeta({layout:'guest',middleware:'auth'})
const route=useRoute(),portal=useCustomerPortal(),{run,error,loading}=portal,receipt=ref<Receipt>()
const print=()=>window.print()
onMounted(()=>run(async()=>{receipt.value=(await portal.receipt(String(route.params.id))).data}))
</script>
