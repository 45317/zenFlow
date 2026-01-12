
export const generateSafeId = (): string => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    // Robust fallback for non-secure contexts
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
  }
};
