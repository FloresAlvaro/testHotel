import { unsavedChangesKey, confirmDiscard } from '~/utils/unsavedChanges'
// La instantánea se mantiene en memoria; nunca persiste datos personales o claves.
export const useUnsavedChanges=<T>(value:()=>T,saving:()=>boolean=()=>false,guardRoutes=true)=>{
 const baseline=ref(JSON.stringify(value()))
 const dirty=computed(()=>JSON.stringify(value())!==baseline.value)
 const markSaved=()=>{baseline.value=JSON.stringify(value())}
 const requestDiscard=()=>!saving()&&(!dirty.value||confirmDiscard())
 const register=inject(unsavedChangesKey,undefined)
 const unregister=register?.(()=>saving()?'busy':dirty.value)
 if(guardRoutes)onBeforeRouteLeave(()=>!dirty.value||requestDiscard())
 const beforeUnload=(event:BeforeUnloadEvent)=>{if(dirty.value){event.preventDefault();event.returnValue=''}}
 onMounted(()=>{markSaved();window.addEventListener('beforeunload',beforeUnload)})
 onBeforeUnmount(()=>{unregister?.();window.removeEventListener('beforeunload',beforeUnload)})
 return {dirty,markSaved,requestDiscard}
}
