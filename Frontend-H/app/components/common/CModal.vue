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

<style scoped lang="scss" src="./CModal.scss"></style>