<template>
  <div class="input-wrapper">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div class="input-container">
      <span v-if="prefixIcon" class="input-prefix">{{ prefixIcon }}</span>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="['input', { 'input-error': error, 'input-success': success }]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      >

      <span v-if="suffixIcon" class="input-suffix">{{ suffixIcon }}</span>
    </div>

    <p v-if="error" class="input-error-text">{{ error }}</p>
    <p v-if="hint" class="input-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

interface Props {
  modelValue: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time' | 'datetime-local';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: boolean;
  hint?: string;
  prefixIcon?: string;
  suffixIcon?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  label: '',
  placeholder: '',
  disabled: false,
  required: false,
  error: '',
  success: false,
  hint: '',
  prefixIcon: '',
  suffixIcon: '',
  id: ''
});

const inputId = props.id || useId();

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  blur: [];
  focus: [];
}>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', props.type === 'number' ? Number(target.value) : target.value);
};

const handleBlur = () => emit('blur');
const handleFocus = () => emit('focus');
</script>

<style scoped lang="scss">
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.input-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary, #1a1a1a);

  .required {
    color: #ef4444;
    margin-left: 2px;
  }
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  background: var(--bg-secondary, #ffffff);
  transition: all 0.2s;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 12px;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--text-primary, #1a1a1a);

  &::placeholder {
    color: var(--text-secondary, #999999);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &-error {
    color: #ef4444;

    &::placeholder {
      color: #fca5a5;
    }
  }

  &-success {
    color: #10b981;

    &::placeholder {
      color: #a7f3d0;
    }
  }
}

.input-prefix,
.input-suffix {
  padding: 0 10px;
  color: var(--text-secondary, #999999);
  font-size: 1.1rem;
  user-select: none;
}

.input-error-text {
  margin: 0;
  font-size: 0.85rem;
  color: #ef4444;
}

.input-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary, #999999);
}
</style>