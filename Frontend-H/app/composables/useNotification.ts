/**
 * Composable para manejar notificaciones
 * Usa el store de UI para mostrar notificaciones temporales
 */
export const useNotification = () => {
  const uiStore = useUiStore();

  // ==================== MÉTODOS ====================

  /**
   * Mostrar notificación de éxito
   */
  const success = (message: string, duration = 3000) => {
    return uiStore.success(message, duration);
  };

  /**
   * Mostrar notificación de error
   */
  const error = (message: string, duration = 5000) => {
    return uiStore.error(message, duration);
  };

  /**
   * Mostrar notificación de advertencia
   */
  const warning = (message: string, duration = 4000) => {
    return uiStore.warning(message, duration);
  };

  /**
   * Mostrar notificación de información
   */
  const info = (message: string, duration = 3000) => {
    return uiStore.info(message, duration);
  };

  /**
   * Eliminar notificación por ID
   */
  const remove = (id: string) => {
    uiStore.removeNotification(id);
  };

  /**
   * Limpiar todas las notificaciones
   */
  const clearAll = () => {
    [...uiStore.notifications].forEach((notification) => {
      uiStore.removeNotification(notification.id);
    });
  };

  /**
   * Notificación de carga
   */
  const loading = (message: string) => {
    return uiStore.addNotification("info", message, 0);
  };

  /**
   * Notificación de confirmación
   */
  const confirm = async (
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void | Promise<void>,
  ) => {
    if (!import.meta.client) return false;

    const confirmed = window.confirm(message);
    if (confirmed) {
      await onConfirm();
    } else {
      await onCancel?.();
    }

    return confirmed;
  };

  /**
   * Mostrar notificación de validación
   */
  const validationError = (field: string, message: string) => {
    return error(`${field}: ${message}`);
  };

  /**
   * Mostrar notificación de éxito de operación
   */
  const operationSuccess = (operation: string, entity: string) => {
    return success(`${operation} de ${entity} completado exitosamente`);
  };

  /**
   * Mostrar notificación de error de operación
   */
  const operationError = (
    operation: string,
    entity: string,
    details?: string,
  ) => {
    const message = details
      ? `Error al ${operation} ${entity}: ${details}`
      : `Error al ${operation} ${entity}`;
    return error(message);
  };

  /**
   * Obtener todas las notificaciones
   */
  const getAll = () => {
    return uiStore.notifications;
  };

  /**
   * Contar notificaciones por tipo
   */
  const countByType = (type: "success" | "error" | "warning" | "info") => {
    return uiStore.notifications.filter((n) => n.type === type).length;
  };

  /**
   * Hay errores?
   */
  const hasErrors = () => {
    return countByType("error") > 0;
  };

  /**
   * Hay advertencias?
   */
  const hasWarnings = () => {
    return countByType("warning") > 0;
  };

  return {
    // Methods
    success,
    error,
    warning,
    info,
    remove,
    clearAll,
    loading,
    confirm,
    validationError,
    operationSuccess,
    operationError,
    getAll,
    countByType,
    hasErrors,
    hasWarnings,

    // Computed
    notifications: computed(() => uiStore.notifications),
  };
};
