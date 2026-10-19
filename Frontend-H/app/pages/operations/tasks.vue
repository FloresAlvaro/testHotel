<template><div class="space-y-6">
<CPageHeader title="Limpieza y mantenimiento" description="Cada salida genera una tarea de limpieza. Finalizar todas las tareas vuelve a habilitar la habitación." />
<p v-if="error" role="alert" class="operation-error">{{ error }}</p>
<CCard v-if="manager"><h2>Nueva tarea</h2><form class="operation-form" @submit.prevent="create"><label>Habitación <select v-model.number="form.room_id" required><option :value="0" disabled>Seleccionar</option><option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.number }}</option></select></label><label>Tipo <select v-model="form.kind"><option value="cleaning">Limpieza</option><option value="maintenance">Mantenimiento</option></select></label><label>Descripción <input v-model="form.title" required maxlength="200"></label><label>Responsable <select v-model="form.assigned_to"><option :value="null">Sin asignar</option><option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option></select></label><label>Observaciones <input v-model="form.notes" maxlength="2000"></label><CButton :loading="busy" type="submit">Crear tarea</CButton></form></CCard>
<CCard><div class="operation-heading"><h2>Tareas del equipo</h2><div class="operation-form"><label>Estado <select v-model="status" @change="page=1;load()"><option value="">Todos</option><option value="pending">Pendientes</option><option value="in_progress">En curso</option><option value="completed">Finalizadas</option></select></label><CButton variant="secondary" :loading="busy" @click="load">Actualizar</CButton><CButton v-if="status" variant="secondary" @click="status='';page=1;load()">Limpiar filtro</CButton></div></div>
<p v-if="busy" role="status">Cargando resultados…</p><CTableHint /><div class="operation-scroll" tabindex="0" role="region" aria-label="Resultados de la tabla" :aria-busy="busy"><table class="operation-table team-tasks-table"><thead><tr><th scope="col">Habitación</th><th scope="col">Tarea</th><th scope="col">Responsable</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody><tr v-for="t in tasks" :key="t.id"><td>{{ t.room_number }}</td><td class="table-text-left">{{ t.title }}<div>{{ t.kind==='cleaning'?'Limpieza':'Mantenimiento' }}</div><p>{{ t.notes }}</p></td><td><select v-if="manager && t.status!=='completed'" class="operation-filter" :value="t.assigned_to || ''" :disabled="busy" :aria-label="`Responsable de tarea ${t.id}`" @change="assign(t.id,$event)"><option value="">Sin asignar</option><option v-for="s in staff" :key="s.id" :value="s.id">{{ s.name }}</option></select><span v-else>{{ t.assigned_name || 'Sin asignar' }}</span></td><td><span class="status-badge" :class="statusClasses[t.status]">{{ states[t.status] }}</span></td><td><div v-if="t.status!=='completed' && (manager||t.assigned_to===auth.user?.id)" class="flex gap-2"><CButton v-if="t.status==='pending'" size="sm" :loading="busy" @click="change(t.id,'in_progress')">Iniciar</CButton><CButton variant="secondary" size="sm" :loading="busy" @click="change(t.id,'completed')">Finalizar</CButton></div></td></tr></tbody></table></div><p v-if="!tasks.length && !busy && !error">No hay tareas para este filtro.</p><CTablePagination :pagination="pagination" :loading="busy" @change="page=$event;load()" />
</CCard></div></template>
<script setup lang="ts">
import type { OperationTask, StaffOption, CalendarData } from '~/types/operations'
definePageMeta({middleware:'auth'})
const {get,list,post,run,error,busy}=useOperations(), auth=useAuthStore()
const manager=computed(()=>auth.isAdmin||auth.isManager)
const tasks=ref<OperationTask[]>([]),staff=ref<StaffOption[]>([]),rooms=ref<CalendarData['rooms']>([]),status=ref(''),page=ref(1),pagination=ref({page:1,pageSize:20,total:0,totalPages:0})
const form=reactive({room_id:0,kind:'cleaning',title:'',notes:'',assigned_to:null as number|null})
const states:Record<string,string>={pending:'Pendiente',in_progress:'En curso',completed:'Finalizada'}
const statusClasses:Record<string,string>={pending:'status-pending',in_progress:'status-occupied',completed:'status-completed'}
const fetchTasks=async()=>{const r=await list<OperationTask>('tasks',{status:status.value||undefined,page:page.value});tasks.value=r.data||[];pagination.value=r.pagination;if(page.value>Math.max(1,r.pagination.totalPages)){page.value=Math.max(1,r.pagination.totalPages);await fetchTasks()}}
const load=()=>run(fetchTasks)
const create=()=>run(async()=>{await post('tasks',{...form});form.title='';form.notes='';await fetchTasks()})
const change=(id:number,status:string)=>run(async()=>{await post(`tasks/${id}`,{status},'PATCH');await fetchTasks()})
const assign=(id:number,event:Event)=>run(async()=>{const v=(event.target as HTMLSelectElement).value;await post(`tasks/${id}`,{assigned_to:v?Number(v):null},'PATCH');await fetchTasks()})
onMounted(()=>run(async()=>{await fetchTasks();staff.value=(await get<StaffOption[]>('task-assignees')).data||[];if(manager.value){let p=1,total=1;const all:CalendarData['rooms']=[];while(all.length<total){const result=(await get<CalendarData>('calendar',{start:'2030-01-01',end:'2030-01-02',page:p++,pageSize:100})).data;if(!result)break;all.push(...result.rooms);total=result.total}rooms.value=all}}))
</script>

<style scoped>
.team-tasks-table tbody td { text-align: center; }
.team-tasks-table tbody td:nth-child(2),
.team-tasks-table tbody td:nth-child(3) { text-align: left; }
.team-tasks-table tbody td:last-child > .flex { justify-content: center; }
</style>
