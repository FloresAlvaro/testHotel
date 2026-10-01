const getDateOnlyTimestamp = (value: string): number | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
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

export const getTodayDateOnly = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
