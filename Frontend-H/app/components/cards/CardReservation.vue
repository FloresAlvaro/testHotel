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

<style scoped lang="scss">
.card-reservation {
  background: var(--bg-secondary, #ffffff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  padding: 16px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  h3 {
    margin: 0 0 4px;
    font-size: 1.1rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.date-item {
  small {
    color: var(--text-secondary, #999999);
    font-size: 0.8rem;
  }

  p {
    margin: 4px 0 0;
    font-weight: 600;
    color: var(--text-primary, #1a1a1a);
  }
}

.room-info,
.price {
  small {
    color: var(--text-secondary, #999999);
    font-size: 0.8rem;
  }

  p {
    margin: 4px 0 0;
    font-weight: 600;
    color: var(--text-primary, #1a1a1a);
  }
}

.price {
  border-top: 1px solid var(--border-color, #e0e0e0);
  padding-top: 12px;
  margin-top: 12px;
}

.card-footer {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}
</style>