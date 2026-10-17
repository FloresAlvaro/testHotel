const getDateOnlyTimestamp = (value: string): number | null => {
  const normalized = value.length > 10 && Number.isFinite(Date.parse(value)) ? value.slice(0, 10) : value;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
};

export const getTodayDateOnly = (timezone = 'America/La_Paz'): string => {
  return new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
};

export const compareDateOnly = (left: string, right: string): number | null => {
  const leftTimestamp = getDateOnlyTimestamp(left);
  const rightTimestamp = getDateOnlyTimestamp(right);
  if (leftTimestamp === null || rightTimestamp === null) return null;
  return Math.sign(leftTimestamp - rightTimestamp);
};

export const daysBetweenDateOnly = (
  start: string,
  end: string,
): number | null => {
  const startTimestamp = getDateOnlyTimestamp(start);
  const endTimestamp = getDateOnlyTimestamp(end);
  if (startTimestamp === null || endTimestamp === null) return null;
  return (endTimestamp - startTimestamp) / 86_400_000;
};

export const formatDateOnly = (value: string): string => {
  const timestamp = getDateOnlyTimestamp(value);
  if (timestamp === null) return value;

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(timestamp);
};

// Los campos DATE de PostgreSQL pueden llegar serializados como ISO.
export const reservationDateOnly = (value: string): string => value.slice(0, 10);

export const localDateOnly = (value: string, timezone = 'America/La_Paz'): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
};
