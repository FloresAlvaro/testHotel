import type { InjectionKey } from 'vue'
export const unsavedChangesKey:InjectionKey<(guard:()=>boolean|'busy')=>()=>void>=Symbol('unsavedChanges')
export const confirmDiscard=()=>window.confirm('Tienes cambios sin guardar. Pulsa Cancelar para seguir editando o Aceptar para descartarlos.')
