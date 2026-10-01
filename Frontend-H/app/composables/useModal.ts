// composables/useModal.ts

export const useModal = <T = unknown>(modalName: string) => {
  const uiStore = useUiStore();

  // ==================== STATE ====================
  const isOpen = computed(() => uiStore.modals[modalName] || false);
  const modalData = ref<T | null>(null);
  const isLoading = ref(false);
  let clearDataTimer: ReturnType<typeof setTimeout> | undefined;

  // ==================== MÉTODOS ====================

  /**
   * Abrir modal
   */
  const open = (data?: T) => {
    if (clearDataTimer) {
      clearTimeout(clearDataTimer);
      clearDataTimer = undefined;
    }
    if (data !== undefined) {
      modalData.value = data;
    }
    uiStore.openModal(modalName);
  };

  /**
   * Cerrar modal
   */
  const close = () => {
    uiStore.closeModal(modalName);
    if (clearDataTimer) clearTimeout(clearDataTimer);
    clearDataTimer = setTimeout(() => {
      modalData.value = null;
      clearDataTimer = undefined;
    }, 300); // Esperar animación de cierre
  };

  /**
   * Toggle modal
   */
  const toggle = (data?: T) => {
    if (isOpen.value) {
      close();
    } else {
      open(data);
    }
  };

  /**
   * Confirmar acción en modal
   */
  const confirm = async (callback: () => void | Promise<void>) => {
    isLoading.value = true;
    try {
      await callback();
      close();
    } catch (error) {
      console.error("Error en confirmación modal:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Cancelar modal
   */
  const cancel = () => {
    close();
  };

  /**
   * Limpiar datos del modal
   */
  const clearData = () => {
    if (clearDataTimer) {
      clearTimeout(clearDataTimer);
      clearDataTimer = undefined;
    }
    modalData.value = null;
  };

  return {
    // State
    isOpen,
    modalData: readonly(modalData),
    isLoading: readonly(isLoading),

    // Methods
    open,
    close,
    toggle,
    confirm,
    cancel,
    clearData,
  };
};
