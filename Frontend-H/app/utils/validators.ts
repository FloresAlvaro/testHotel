/**
 * Funciones de validación
 * Nota: También están en useValidation(), esto es como alternativa
 */

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+591|0)?[2-9]\d{7,8}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
};

export const isValidDocument = (document: string): boolean => {
  const docRegex = /^[0-9]{7,8}$/;
  return docRegex.test(document.replace(/\D/g, ""));
};

export const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  return (
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

export const isValidLength = (
  value: string,
  min: number,
  max: number,
): boolean => {
  return value.length >= min && value.length <= max;
};

export const isValidNumber = (value: unknown): boolean => {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value))
  );
};

export const isPositiveNumber = (value: unknown): boolean => {
  return isValidNumber(value) && Number(value) > 0;
};

export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const isValidDate = (dateString: string): boolean => {
  return !Number.isNaN(new Date(dateString).getTime());
};

export const isFutureDate = (dateString: string): boolean => {
  return new Date(dateString) > new Date();
};

export const isPastDate = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

export const isValidDateRange = (
  startDate: string,
  endDate: string,
): boolean => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;
  return new Date(startDate) < new Date(endDate);
};

export const isMinAge = (birthDate: string, minAge: number): boolean => {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
    ? age - 1 >= minAge
    : age >= minAge;
};

export const isValidCreditCard = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

export const validateObject = (
  obj: Record<string, unknown>,
  schema: Record<string, (value: unknown) => boolean>,
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(obj[key])) errors[key] = `Validación fallida para ${key}`;
  }
  return { valid: Object.keys(errors).length === 0, errors };
};
