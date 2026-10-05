<template>
  <div class="card-reservation">
    <div class="card-header">
      <div>
        <h3>#{{ reservation.id }}</h3>
        <p>{{ reservation.client_name || 'Cliente' }}</p>
      </div>
      <span :class="['status-badge', `status-${reservation.status}`]">
        {{ RESERVATION_STATUS_LABELS[reservation.status] }}
      </span>
    </div>

    <div class="card-body">
      <div class="dates">
        <div class="date-item">
          <small>Check-in</small>
          <p>{{ formatDate(reservation.check_in, 'DD/MM/YYYY') }}</p>
        </div>
        <div class="date-item">
          <small>Check-out</small>
          <p>{{ formatDate(reservation.check_out, 'DD/MM/YYYY') }}</p>
        </div>
      </div>

      <div class="room-info">
        <small>Habitación</small>
        <p>{{ reservation.room_number }} - {{ reservation.room_type_name }}</p>
      </div>

      <div class="price">
        <small>Total</small>
          <p>{{ formatCurrency(Number(reservation.total_price)) }}</p>
      </div>

      <div class="card-footer">
        <CButton variant="secondary" size="sm" @click="$emit('view')">
          Ver
        </CButton>
        <CButton variant="primary" size="sm" @click="$emit('checkin')">
          Check-in
        </CButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reservation } from '~/types';
import { RESERVATION_STATUS_LABELS } from '~/utils/constants';
import { formatDate, formatCurrency } from '~/utils/formatters';

interface Props {
  reservation: Reservation;
}

defineProps<Props>();
defineEmits<{
  view: [];
  checkin: [];
}>();
</script>

<style scoped lang="scss" src="./CardReservation.scss"></style>