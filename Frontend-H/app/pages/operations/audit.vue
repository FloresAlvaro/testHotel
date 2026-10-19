<template><div class="space-y-6"><CPageHeader title="Historial de cambios" description="Registro de modificaciones, responsables y valores anteriores. Las contraseñas se excluyen del historial." /><p v-if="error" role="alert" class="operation-error">{{ error }}</p><CCard><form class="operation-form mb-6" @submit.prevent="page=1;load()"><label>Sección <select v-model="filters.table"><option value="">Todas</option><option v-for="(label,key) in tables" :key="key" :value="key">{{ label }}</option></select></label><label>Acción <select v-model="filters.action"><option value="">Todas</option><option value="INSERT">Creación</option><option value="UPDATE">Modificación</option><option value="DELETE">Eliminación</option></select></label><label>Responsable <select v-model="filters.user_id"><option value="">Todos</option><option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option></select></label><label>Desde <input v-model="filters.start" type="date"></label><label>Hasta <input v-model="filters.end" type="date"></label><label>ID del registro <input v-model="filters.record_id" type="number" min="1"></label><CButton :loading="busy" type="submit">Filtrar</CButton><CButton variant="secondary" type="button" :disabled="busy" @click="clearFilters">Limpiar filtros</CButton></form><p v-if="busy" role="status">Cargando resultados…</p><CTableHint /><div class="operation-scroll" tabindex="0" role="region" aria-label="Resultados de la tabla" :aria-busy="busy"><table class="table-data-centered operation-table"><thead><tr><th scope="col">Fecha</th><th scope="col">Responsable</th><th scope="col">Sección / registro</th><th scope="col">Acción</th><th scope="col">Cambios</th></tr></thead><tbody><tr v-for="a in entries" :key="a.id"><td>{{ dateTime(a.created_at) }}</td><td class="table-text-left">{{ a.user_name || 'Sistema / migración' }}</td><td>{{ tables[a.table_name] || a.table_name }} #{{ a.record_id }}</td><td>{{ actions[a.action] || a.action }}</td><td><CButton variant="secondary" size="sm" @click="selected=a">Ver valores</CButton></td></tr></tbody></table></div><p v-if="!entries.length && !busy && !error">No hay cambios con estos filtros.</p><CTablePagination :pagination="pagination" :loading="busy" @change="page=$event;load()" /></CCard><CModal :is-open="!!selected" title="Detalle del cambio" size="lg" @close="selected=null">
  <template v-if="selected">
    <p class="audit-context">{{ tables[selected.table_name] || selected.table_name }} #{{ selected.record_id }} · {{ actions[selected.action] || selected.action }}</p>
    <p class="audit-context">{{ selected.user_name || 'Sistema / migración' }} · {{ dateTime(selected.created_at) }}</p>
    <div v-if="changed(selected).length" class="audit-changes">
      <section v-for="key in changed(selected)" :key="key" class="audit-change">
        <h3>{{ fieldLabel(key) }}</h3>
        <div class="audit-values">
          <div><span>Antes</span><p>{{ display(selected.old_value?.[key],key,selected.old_value) }}</p></div>
          <div><span>Después</span><p>{{ display(selected.new_value?.[key],key,selected.new_value) }}</p></div>
        </div>
      </section>
    </div>
    <p v-else class="audit-empty">Este evento no tiene valores modificados.</p>
  </template>
  <template #footer><CButton variant="secondary" @click="selected=null">Cerrar</CButton></template>
</CModal></div></template>
<script setup lang="ts">
import type { AuditEntry, StaffOption } from '~/types/operations'
definePageMeta({middleware:['auth','manager']})
const {get,list,run,error,busy}=useOperations(),{dateTime,money,settings}=useHotelSettings()
const entries=ref<AuditEntry[]>([]),staff=ref<StaffOption[]>([]),page=ref(1),pagination=ref({page:1,pageSize:20,total:0,totalPages:0})
const selected=ref<AuditEntry | null>(null)
const fieldLabels:Record<string,string>={adults:'Adultos',children:'Niños',arrival_time:'Hora de llegada',special_requests:'Solicitudes especiales',status:'Estado',check_in:'Llegada',check_out:'Salida',total_price:'Precio total',notes:'Observaciones',name:'Nombre',email:'Correo',phone:'Teléfono',amount:'Importe',method:'Método',updated_at:'Última actualización',created_at:'Fecha de creación'}
Object.assign(fieldLabels,{
 id:'Identificador',summary:'Resumen de caja',opening_amount:'Importe de apertura',counted_amount:'Importe contado',expected_amount:'Importe esperado',opened_at:'Fecha de apertura',closed_at:'Fecha de cierre',closed_by:'Usuario que cerró la caja',currency:'Moneda',total:'Total',movements:'Movimientos',
 role:'Rol',is_active:'Activo',auth_version:'Versión de acceso',client_id:'Identificador del huésped',user_id:'Identificador del usuario',room_id:'Identificador de habitación',room_type_id:'Identificador del tipo de habitación',reservation_id:'Identificador de reserva',assigned_to:'Responsable asignado',assigned_name:'Nombre del responsable',created_by:'Creado por',completed_at:'Fecha de finalización',kind:'Tipo de tarea',title:'Título',
 document:'Documento',document_type:'Tipo de documento',address:'Dirección',city:'Ciudad',country:'País',nationality:'Nacionalidad',date_of_birth:'Fecha de nacimiento',gender:'Género',emergency_contact:'Contacto de emergencia',emergency_phone:'Teléfono de emergencia',
 description:'Descripción',price:'Precio',capacity:'Capacidad',amenities:'Servicios',image:'Imagen',image_url:'Dirección de la imagen',number:'Número',floor:'Piso',type:'Tipo de pago',transaction_id:'Identificador de transacción',check_in_time:'Fecha y hora de entrada',check_out_time:'Fecha y hora de salida',
 hotel_name:'Nombre del hotel',check_in_time_setting:'Hora de entrada',check_out_time_setting:'Hora de salida',timezone:'Zona horaria',version:'Versión',cover_image:'Imagen de portada',request_notice_hours:'Antelación de solicitudes (horas)',deposit_percent:'Anticipo (%)',payment_due_hours:'Vigencia del pago (horas)'
})
const fieldLabel=(key:string)=>fieldLabels[key] || 'Dato adicional'
const methods:Record<string,string>={cash:'Efectivo',credit_card:'Tarjeta de crédito',debit_card:'Tarjeta de débito',bank_transfer:'Transferencia bancaria',transfer:'Transferencia bancaria',check:'Cheque',other:'Otro'}
const values:Record<string,Record<string,string>>={
 method:methods,role:{admin:'Administrador',manager:'Gerente',receptionist:'Recepción',customer:'Huésped'},
 status:{available:'Disponible',occupied:'Ocupada',reserved:'Reservada',maintenance:'En mantenimiento',confirmed:'Confirmada',checked_in:'Entrada realizada',checked_out:'Salida realizada',cancelled:'Cancelada',pending:'Pendiente',in_progress:'En curso',completed:'Completado',failed:'Fallido',refunded:'Reembolsado'},
 kind:{cleaning:'Limpieza',maintenance:'Mantenimiento'},type:{full:'Pago completo',partial:'Pago parcial',advance:'Anticipo'},
 document_type:{cedula:'Cédula',passport:'Pasaporte',license:'Licencia',other:'Otro'},gender:{F:'Femenino',M:'Masculino',O:'Otro'}
}
const amountKeys=new Set(['amount','total','price','total_price','opening_amount','counted_amount','expected_amount'])
const filters=reactive({table:'',action:'',user_id:'',record_id:'',start:'',end:''})
const tables:Record<string,string>={reservation:'Reservas',payment:'Pagos',room:'Habitaciones',client:'Huéspedes',user:'Equipo',hotel_settings:'Configuración',housekeeping_task:'Tareas',cash_shift:'Caja',room_type:'Tipos de habitación',check_in_log:'Entradas y salidas'}
const actions:Record<string,string>={INSERT:'Creación',UPDATE:'Modificación',DELETE:'Eliminación'}
const changed=(a:AuditEntry)=>Array.from(new Set([...Object.keys(a.old_value||{}),...Object.keys(a.new_value||{})])).filter(k=>JSON.stringify(a.old_value?.[k])!==JSON.stringify(a.new_value?.[k]))
const display=(v:unknown,key:string,record:Record<string,unknown>|null|undefined):string=>{
 if(v===null||v===undefined)return '—'
 if(v==='')return 'Sin contenido'
 if(typeof v==='boolean')return v?'Sí':'No'
 if(Array.isArray(v))return v.length?v.map(item=>display(item,key,record)).join('\n\n'):key==='summary'?'Sin movimientos':'Sin elementos'
 if(typeof v==='object')return Object.entries(v).map(([field,value])=>`${fieldLabel(field)}: ${display(value,field,record)}`).join('\n')
 if(amountKeys.has(key)&&Number.isFinite(Number(v)))return money(String(v),typeof record?.currency==='string'?record.currency:settings.value.currency)
 if(typeof v==='string'){
  if(values[key]?.[v])return values[key][v]
  // Las fechas sin hora no deben cambiar de día por la zona horaria del navegador.
  if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v.split('-').reverse().join('/')
  if((key.endsWith('_at')||key.endsWith('_time'))&&/^\d{4}-\d{2}-\d{2}T/.test(v)&&!Number.isNaN(Date.parse(v))){
   if(/(?:Z|[+-]\d{2}:\d{2})$/.test(v))return dateTime(v)
   // Un TIMESTAMP sin zona representa la hora local del hotel, no un instante UTC.
   const [day,time]=v.split('T');return `${day!.split('-').reverse().join('/')}, ${time!.slice(0,5)}`
  }
  if(/^\d{2}:\d{2}(?::\d{2})?$/.test(v))return v.slice(0,5)
 }
 return String(v)
}
const clearFilters=()=>{Object.assign(filters,{table:'',action:'',user_id:'',record_id:'',start:'',end:''});page.value=1;load()}
const load=()=>run(async()=>{const q:Record<string,string|number|undefined>={page:page.value};for(const [k,v] of Object.entries(filters))q[k]=v||undefined;const r=await list<AuditEntry>('audit',q);entries.value=r.data||[];pagination.value=r.pagination})
onMounted(async()=>{await load();await run(async()=>{staff.value=(await get<StaffOption[]>('task-assignees')).data||[]})})
</script>
<style scoped>
.audit-context { color:var(--text-secondary);font-size:12px;margin-bottom:8px;overflow-wrap:anywhere; }
.audit-changes { margin-top:20px; }
.audit-change { padding:16px 0;border-top:1px solid var(--border-color); }
.audit-change h3 { font-size:13px;font-weight:600;margin:0 0 12px;overflow-wrap:anywhere; }
.audit-values { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px; }
.audit-values > div { padding:12px;background:var(--surface-subtle);border-radius:7px; }
.audit-values span { font-size:11px;color:var(--text-secondary); }
.audit-values p { margin:6px 0 0;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere; }
.audit-empty { padding:20px 0;color:var(--text-secondary); }
@media(max-width:640px) { .audit-values { grid-template-columns:minmax(0,1fr); } }
</style>
