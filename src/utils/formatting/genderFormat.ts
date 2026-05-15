export function formatGender(gender: string): string {
  switch (gender?.toLowerCase()) {
    case 'male':
      return 'H';
    case 'female':
      return 'F';
    default:
      return '';
  }
}