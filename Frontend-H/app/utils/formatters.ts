/**
 * Funciones para formatear datos
 */

/**
 * Formatear número como moneda
 */
export const formatCurrency = (
  amount: number,
  currency = "USD",
  locale = "es-BO",
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formatear moneda boliviana (Bs)
 */
export const formatBs = (amount: number): string => {
  return `Bs. ${amount.toFixed(2)}`;
};

/**
 * Formatear fecha
 */
export const formatDate = (
  date: string | Date,
  format = "DD/MM/YYYY",
): string => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "Fecha inválida";
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  const formats: Record<string, string> = {
    "DD/MM/YYYY": `${day}/${month}/${year}`,
    "YYYY-MM-DD": `${year}-${month}-${day}`,
    "DD MMM YYYY": `${day} ${getMonthName(d.getMonth())} ${year}`,
    "DD/MM/YYYY HH:mm": `${day}/${month}/${year} ${hours}:${minutes}`,
  };

  return formats[format] || `${day}/${month}/${year}`;
};

/**
 * Obtener nombre del mes
 */
export const getMonthName = (month: number): string => {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return months[month] || "";
};

/**
 * Obtener nombre del día
 */
export const getDayName = (day: number): string => {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[day] || "";
};

/**
 * Formatear teléfono
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 7) {
    // Teléfono local: 1234567 → 123-4567
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }

  if (cleaned.length === 10) {
    // Teléfono internacional: 5912341234 → +591 234 1234
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }

  return phone;
};

/**
 * Formatear documento (cédula)
 */
export const formatDocument = (document: string): string => {
  const cleaned = document.replace(/\D/g, "");

  if (cleaned.length <= 7) {
    return cleaned;
  }

  // Formato: 12345678 → 12345-678
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
};

/**
 * Formatear nombre propio
 */
export const formatName = (name: string): string => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Formatear porcentaje
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatear número grande con separadores
 */
export const formatNumber = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Truncar texto
 */
export const truncateText = (
  text: string,
  length = 50,
  suffix = "...",
): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + suffix;
};

/**
 * Capitalizar primera letra
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Convertir a slug
 */
export const toSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

/**
 * Tiempo relativo (ej: "hace 2 horas")
 */
export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "hace unos segundos";
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  if (days < 30) return `hace ${days} día${days > 1 ? "s" : ""}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `hace ${months} mes${months > 1 ? "es" : ""}`;
  }

  const years = Math.floor(days / 365);
  return `hace ${years} año${years > 1 ? "s" : ""}`;
};

/**
 * Formatear duración (ej: "2 días, 3 horas")
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days} día${days > 1 ? "s" : ""}`);
  if (hours % 24 > 0)
    parts.push(`${hours % 24} hora${hours % 24 > 1 ? "s" : ""}`);
  if (minutes % 60 > 0)
    parts.push(`${minutes % 60} minuto${minutes % 60 > 1 ? "s" : ""}`);

  return parts.join(", ") || "0 segundos";
};

/**
 * Formatear rango de fechas
 */
export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
): string => {
  const start = formatDate(startDate, "DD MMM");
  const end = formatDate(endDate, "DD MMM YYYY");
  return `${start} - ${end}`;
};

/**
 * Obtener días restantes
 */
export const getDaysRemaining = (targetDate: string | Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
