<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" :data-size="size" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">{{ title }}</h2>
            <button class="modal-close" aria-label="Cerrar ventana" @click="closeModal">✕</button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div v-if="$slots['footer']" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnOverlay: true
});

const emit = defineEmits<{
  close: [];
}>();

const closeModal = () => emit('close');

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    closeModal();
  }
};

// Prevenir scroll cuando el modal está abierto
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }
);

onBeforeUnmount(() => {
  document.body.style.overflow = 'auto';
});
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: var(--bg-secondary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;

  max-width: 400px;

  &[data-size='md'] {
    max-width: 600px;
  }

  &[data-size='lg'] {
    max-width: 900px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary, #999999);
  transition: color 0.2s;

  &:hover {
    color: var(--text-primary, #1a1a1a);
  }
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

// ==================== TRANSICIONES ====================
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .modal-container {
    transition: transform 0.3s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.95);
  }
}
</style>