<template>
  <Teleport to="body">
    <dialog ref="dialog" class="modal-container" :data-size="size" :aria-labelledby="titleId" @cancel.prevent="requestClose" @click="handleBackdrop">
      <div class="modal-header"><h2 :id="titleId" class="modal-title">{{ title }}</h2><button type="button" class="icon-button" aria-label="Cerrar ventana" @click="requestClose"><Icon name="system-uicons:cross" /></button></div>
      <div class="modal-body"><slot /></div>
      <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
    </dialog>
  </Teleport>
</template>
<script setup lang="ts">
import { unsavedChangesKey, confirmDiscard } from '~/utils/unsavedChanges'
const guards=new Set<()=>boolean|'busy'>()
provide(unsavedChangesKey,guard=>{guards.add(guard);return ()=>guards.delete(guard)})
const requestClose=()=>{const states=[...guards].map(guard=>guard());if(props.busy||states.includes('busy'))return;if(!(props.dirty||states.some(Boolean))||confirmDiscard())emit('close')}

const props = withDefaults(defineProps<{ isOpen: boolean; title: string; size?: 'sm' | 'md' | 'lg'; closeOnOverlay?: boolean; dirty?:boolean; busy?:boolean }>(), { size: 'md', closeOnOverlay: true });
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
let previousOverflow: string | undefined;
const sync = () => {
  if (!import.meta.client || !dialog.value) return;
  if (props.isOpen && !dialog.value.open) { previousOverflow = document.body.style.overflow; dialog.value.showModal(); document.body.style.overflow = 'hidden'; }
  else if (!props.isOpen && dialog.value.open) { dialog.value.close(); document.body.style.overflow = previousOverflow ?? ''; previousOverflow = undefined; }
};
const handleBackdrop = (event: MouseEvent) => {
  const element = dialog.value;
  if (!element || !props.closeOnOverlay || event.target !== element) return;
  const rect = element.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) requestClose();
};
watch(() => props.isOpen, sync, { flush: 'post' });
onMounted(sync);
onBeforeUnmount(() => { if (previousOverflow !== undefined) document.body.style.overflow = previousOverflow; dialog.value?.close(); });
</script>
<style scoped>
.modal-container { padding: 0; margin: auto; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 12px; width: calc(100% - 32px); max-width: 560px; max-height: calc(100dvh - 48px); box-shadow: 0 24px 90px #11182726; overflow: auto; }
.modal-container::backdrop { background: #11182775; backdrop-filter: blur(3px); }
.modal-container[data-size=sm] { max-width: 420px; }
.modal-container[data-size=lg] { max-width: 800px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
.modal-title { font-size: 17px; font-weight: 600; letter-spacing: -.3px; margin: 0; }
.modal-body { padding: 24px; }
.modal-footer { border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; padding: 16px 24px; }
</style>
