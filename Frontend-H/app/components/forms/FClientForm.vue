<template>
  <form class="form" @submit.prevent="handleSubmit">
    <div class="form-row">
      <CInput
        v-model="form.name"
        label="Nombre Completo"
        placeholder="Ej: Juan Pérez"
        required
        :error="errors.name"
        @blur="validateField('name')"
      />
    </div>

    <div class="form-row-2">
      <CInput
        v-model="form.email"
        label="Email"
        type="email"
        placeholder="correo@ejemplo.com"
        required
        :error="errors.email"
        @blur="validateField('email')"
      />

      <CInput
        v-model="form.phone"
        label="Teléfono"
        type="tel"
        placeholder="591-1234567"
        :error="errors.phone"
        @blur="validateField('phone')"
      />
    </div>

    <div class="form-row-2">
      <CInput
        v-model="form.document_type"
        label="Tipo Documento"
        placeholder="cedula"
        required
      />

      <CInput
        v-model="form.document"
        label="Número Documento"
        placeholder="1234567"
        required
        :error="errors.document"
        @blur="validateField('document')"
      />
    </div>

    <div class="form-row-2">
      <CInput
        v-model="form.gender"
        label="Género"
        placeholder="M"
      />

      <CInput
        v-model="form.country"
        label="País"
        placeholder="Bolivia"
      />
    </div>

    <div class="form-row">
      <CInput
        v-model="form.address"
        label="Dirección"
        placeholder="Calle y número"
      />
    </div>

    <div class="form-actions">
      <CButton
        variant="secondary"
        type="button"
        @click="handleCancel"
      >
        Cancelar
      </CButton>

      <CButton
        variant="primary"
        type="submit"
        :loading="loading"
      >
        {{ isEditing ? 'Actualizar' : 'Guardar' }} Cliente
      </CButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Client, CreateClientRequest, DocumentType, Gender } from '~/types';

interface Props {
  client?: Client | null;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  submit: [data: CreateClientRequest];
  cancel: [];
}>();

const { validateEmail, validatePhone, validateDocument } = useValidation();

interface ClientFormValues {
  name: string;
  email: string;
  phone: string;
  document_type: DocumentType;
  document: string;
  gender: Gender | '';
  country: string;
  address: string;
}

const form = ref<ClientFormValues>({
  name: '',
  email: '',
  phone: '',
  document_type: 'cedula',
  document: '',
  gender: 'M',
  country: 'Bolivia',
  address: ''
});

const errors = ref<Record<string, string>>({});

const isEditing = computed(() => !!props.client);

// Cargar cliente si está en modo edición
watch(
  () => props.client,
  (client) => {
    if (client) {
      form.value = {
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        document_type: client.document_type,
        document: client.document,
        gender: client.gender ?? '',
        country: client.country ?? 'Bolivia',
        address: client.address ?? ''
      };
    } else {
      form.value = {
        name: '',
        email: '',
        phone: '',
        document_type: 'cedula',
        document: '',
        gender: 'M',
        country: 'Bolivia',
        address: ''
      };
    }
  },
  { immediate: true }
);

const validateField = (field: string) => {
  errors.value[field] = '';

  switch (field) {
    case 'email':
      if (form.value.email && !validateEmail(form.value.email)) {
        errors.value.email = 'Email inválido';
      }
      break;
    case 'phone':
      if (form.value.phone && !validatePhone(form.value.phone)) {
        errors.value.phone = 'Teléfono inválido';
      }
      break;
    case 'document':
      if (!form.value.document.trim()) {
        errors.value.document = 'Documento requerido';
      } else if (!validateDocument(form.value.document)) {
        errors.value.document = 'Documento inválido';
      }
      break;
    case 'name':
      if (!form.value.name.trim()) {
        errors.value.name = 'Nombre requerido';
      }
      break;
  }
};

const handleSubmit = () => {
  // Validar todos los campos
  Object.keys(form.value).forEach((field) => {
    validateField(field);
  });

  if (Object.values(errors.value).some((e) => e)) {
    return;
  }

  const data: CreateClientRequest = {
    name: form.value.name.trim(),
    document: form.value.document.trim(),
    document_type: form.value.document_type,
    email: form.value.email.trim() || undefined,
    phone: form.value.phone.trim() || undefined,
    country: form.value.country.trim() || undefined,
    address: form.value.address.trim() || undefined,
    gender: form.value.gender || undefined
  };
  emit('submit', data);
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped lang="scss" src="./FClientForm.scss"></style>