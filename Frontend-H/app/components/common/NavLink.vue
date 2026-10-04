<template>
  <NuxtLink
    :to="href"
    class="nav-link"
    :class="{ active, compact }"
    :title="compact ? label : undefined"
    :aria-label="compact ? label : undefined"
  >
    <Icon :name="icon" class="nav-link-icon" aria-hidden="true" />
    <span class="nav-link-label">{{ label }}</span>
  </NuxtLink>
</template>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition: background-color 160ms ease, color 160ms ease;
  font-size: 0.94rem;
}

.nav-link:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.nav-link.active {
  color: #2563eb;
  background: #eff6ff;
  border-left-color: #2563eb;
  font-weight: 600;
}

.nav-link-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.nav-link.compact {
  justify-content: center;
  padding-inline: 0;
}

.nav-link-label {
  white-space: nowrap;
}

.nav-link.compact .nav-link-label {
  display: none;
}

@media (max-width: 768px) {
  .nav-link.compact {
    justify-content: flex-start;
    padding-inline: 16px;
  }

  .nav-link.compact .nav-link-label {
    display: inline;
  }
}

:global(.dark) .nav-link.active {
  background: rgba(37, 99, 235, 0.14);
}
</style>