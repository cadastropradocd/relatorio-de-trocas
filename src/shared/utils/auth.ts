export const usernameToEmail = (username: string): string => {
  return `${username.toLowerCase().trim()}@trocas.app`;
};

export const convertFirestoreTimestamp = (value: unknown): string => {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
};
