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

<style scoped lang="scss" src="./CInput.scss"></style>