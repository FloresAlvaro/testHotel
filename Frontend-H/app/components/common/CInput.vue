<template>
  <div class="input-wrapper" v-bind="{ class: attrs.class, style: attrs.style }">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="required" aria-hidden="true">*</span>
    </label>

    <div class="input-container">
      <span v-if="$slots.prefixIcon || prefixIcon" class="input-prefix"><slot name="prefixIcon">{{ prefixIcon }}</slot></span>

      <input
        v-bind="inputAttributes"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :aria-label="typeof attrs['aria-label'] === 'string' ? attrs['aria-label'] : !label ? placeholder : undefined"
        :disabled="disabled || !ready"
        :required="required"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined"
        :class="['input', { 'input-error': error, 'input-success': success }]"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      >

      <span v-if="$slots.suffixIcon || suffixIcon" class="input-suffix"><slot name="suffixIcon">{{ suffixIcon }}</slot></span>
    </div>

    <p v-if="error" :id="`${inputId}-error`" role="alert" class="input-error-text">{{ error }}</p>
    <p v-if="hint" :id="`${inputId}-hint`" class="input-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';
defineOptions({ inheritAttrs: false });
const ready=ref(false);
onMounted(()=>{ready.value=true});
const attrs = useAttrs();
const inputAttributes = computed(() => Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')));

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

<style scoped>

.input-wrapper { display: flex; flex-direction: column; gap: 7px; width: 100%; min-width: 0; }
.input-label { font-size: 12px; font-weight: 500; color: var(--text-primary); }
.required { color: var(--danger); margin-left: 3px; }
.input-container { display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: 7px; background: var(--bg-secondary); transition: border-color .15s, box-shadow .15s; }
.input-container:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.input { flex: 1; width: 100%; min-width: 0; min-height: 40px; padding: 10px 12px; border: 0; outline: 0; background: transparent; color: var(--text-primary); font-size: 12px; border-radius: inherit; }
.input:focus-visible { outline: none; }
.input::placeholder { color: var(--text-tertiary); }
.input:disabled { opacity: .55; cursor: not-allowed; }
.input-error { color: var(--danger); }
.input-prefix, .input-suffix { display: inline-flex; align-items: center; padding: 0 0 0 12px; color: var(--text-tertiary); font-size: 17px; }
.input-suffix { padding: 0 12px 0 0; }
.input-error-text, .input-hint { font-size: 11px; margin: 0; color: var(--text-secondary); }
.input-error-text { color: var(--danger); }

</style>
