import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", () => {
  type NotificationType = "success" | "error" | "warning" | "info";

  // State
  const sidebarOpen = ref(true);
  const sidebarCompact = ref(false);
  const mobileMenuOpen = computed(() => sidebarOpen.value);
  const notifications = ref<
    Array<{
      id: string;
      type: "success" | "error" | "warning" | "info";
      message: string;
      duration?: number;
    }>
  >([]);
  const modals = ref<Record<string, boolean>>({});
  const theme = ref<"light" | "dark">("light");
  const loading = ref(false);

  // Computed
  // Actions
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
  };

  const toggleSidebarCompact = () => {
    sidebarCompact.value = !sidebarCompact.value;
  };

  const closeSidebar = () => {
    sidebarOpen.value = false;
  };

  const openSidebar = () => {
    sidebarOpen.value = true;
  };

  const toggleMobileMenu = () => {
    toggleSidebar();
  };

  const closeMobileMenu = () => {
    closeSidebar();
  };

  const addNotification = (
    type: NotificationType,
    message: string,
    duration = 3000,
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    notifications.value.push({ id, type, message, duration });

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const success = (message: string, duration = 3000) =>
    addNotification("success", message, duration);
  const error = (message: string, duration = 5000) =>
    addNotification("error", message, duration);
  const warning = (message: string, duration = 3000) =>
    addNotification("warning", message, duration);
  const info = (message: string, duration = 3000) =>
    addNotification("info", message, duration);

  const openModal = (name: string) => {
    modals.value[name] = true;
  };

  const closeModal = (name: string) => {
    modals.value[name] = false;
  };

  const toggleModal = (name: string) => {
    modals.value[name] = !modals.value[name];
  };

  const applyTheme = () => {
    if (import.meta.client) document.documentElement.classList.toggle('dark', theme.value === 'dark');
  };

  const toggleTheme = () => {
    theme.value = theme.value === "light" ? "dark" : "light";
    if (import.meta.client) {
      applyTheme();
      localStorage.setItem("theme", theme.value);
    }
  };

  const setTheme = (newTheme: "light" | "dark") => {
    theme.value = newTheme;
    if (import.meta.client) {
      applyTheme();
      localStorage.setItem("theme", newTheme);
    }
  };

  const loadTheme = () => {
    if (!import.meta.client) return;

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      theme.value = savedTheme;
    }
    applyTheme();
  };

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  return {
    // State
    sidebarOpen,
    sidebarCompact,
    mobileMenuOpen,
    notifications,
    modals,
    theme,
    loading,

    // Computed

    // Methods
    toggleSidebar,
    toggleSidebarCompact,
    closeSidebar,
    openSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    openModal,
    closeModal,
    toggleModal,
    toggleTheme,
    setTheme,
    loadTheme,
    setLoading,
  };
});

export { useUiStore as useUIStore };
