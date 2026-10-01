/**
 * Composable para validaciones comunes
 */
export const useValidation = () => {
  // ==================== VALIDADORES ====================

  /**
   * Validar email
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validar teléfono
   */
  const validatePhone = (phone: string): boolean => {
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  };

  /**
   * Validar documento (cédula boliviana)
   */
  const validateDocument = (document: string): boolean => {
    // Formato: 1234567 o 12345678 (7-8 dígitos)
    const docRegex = /^[0-9]{7,8}$/;
    return docRegex.test(document);
  };

  /**
   * Validar contraseña
   */
  const validatePassword = (
    password: string,
  ): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Debe contener mayúscula");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Debe contener minúscula");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Debe contener número");
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("Debe contener carácter especial (!@#$%^&*)");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Validar URL
   */
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Validar campo requerido
   */
  const validateRequired = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  };

  /**
   * Validar longitud mínima
   */
  const validateMinLength = (value: string, min: number): boolean => {
    return value.length >= min;
  };

  /**
   * Validar longitud máxima
   */
  const validateMaxLength = (value: string, max: number): boolean => {
    return value.length <= max;
  };

  /**
   * Validar número
   */
  const validateNumber = (value: unknown): boolean => {
    return (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      Number.isFinite(Number(value))
    );
  };

  /**
   * Validar número positivo
   */
  const validatePositiveNumber = (value: unknown): boolean => {
    return validateNumber(value) && Number(value) > 0;
  };

  /**
   * Validar rango de números
   */
  const validateNumberRange = (
    value: number,
    min: number,
    max: number,
  ): boolean => {
    return value >= min && value <= max;
  };

  /**
   * Validar fechas
   */
  const validateDateRange = (
    startDate: string,
    endDate: string,
  ): { isValid: boolean; error?: string } => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      return { isValid: false, error: "Fecha de inicio inválida" };
    }

    if (isNaN(end.getTime())) {
      return { isValid: false, error: "Fecha de fin inválida" };
    }

    if (start >= end) {
      return {
        isValid: false,
        error: "La fecha de fin debe ser posterior a la de inicio",
      };
    }

    return { isValid: true };
  };

  /**
   * Validar fecha futura
   */
  const validateFutureDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return date > today;
  };

  /**
   * Validar fecha pasada
   */
  const validatePastDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
  };

  /**
   * Validar edad mínima
   */
  const validateMinAge = (birthDate: string, minAge: number): boolean => {
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1 >= minAge;
    }

    return age >= minAge;
  };

  /**
   * Validar tarjeta de crédito (Luhn)
   */
  const validateCreditCard = (cardNumber: string): boolean => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      const digitCharacter = digits[i];
      if (!digitCharacter) continue;
      let digit = parseInt(digitCharacter, 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  /**
   * Validar múltiples campos (objeto)
   */
  const validateObject = (
    obj: Record<string, unknown>,
    schema: Record<string, (value: unknown) => boolean>,
  ): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    Object.keys(schema).forEach((key) => {
      const value = obj[key];
      const validator = schema[key];

      if (!validator || !validator(value)) {
        errors[key] = `Validación fallida para ${key}`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  /**
   * Sanitizar entrada (básico)
   */
  const sanitize = (input: string): string => {
    return input
      .replace(/[<>]/g, "") // Remover < y >
      .trim();
  };

  /**
   * Validar y sanitizar email
   */
  const validateAndSanitizeEmail = (
    email: string,
  ): { isValid: boolean; value: string } => {
    const sanitized = sanitize(email).toLowerCase();
    return {
      isValid: validateEmail(sanitized),
      value: sanitized,
    };
  };

  return {
    // Métodos
    validateEmail,
    validatePhone,
    validateDocument,
    validatePassword,
    validateUrl,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateNumber,
    validatePositiveNumber,
    validateNumberRange,
    validateDateRange,
    validateFutureDate,
    validatePastDate,
    validateMinAge,
    validateCreditCard,
    validateObject,
    sanitize,
    validateAndSanitizeEmail,
  };
};
