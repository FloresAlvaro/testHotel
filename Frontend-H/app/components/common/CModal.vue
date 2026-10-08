<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
        <div ref="dialog" class="modal-container" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1" :data-size="size" @click.stop>
          <div class="modal-header">
            <h2 :id="titleId" class="modal-title">{{ title }}</h2>
            <button type="button" class="modal-close" aria-label="Cerrar ventana" @click="closeModal">✕</button>
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
import { useId } from 'vue';

const dialog = ref<HTMLElement | null>(null);
const titleId = useId();
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

useDialogAccessibility(dialog, () => props.isOpen, closeModal);
</script>

<style scoped lang="scss" src="~/assets/styles/components/common/CModal.scss"></style>
