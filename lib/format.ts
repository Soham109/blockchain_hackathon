/**
 * Format a name string to proper case (first letter of each word capitalized)
 * Example: "SOHAM AGGARWAL" -> "Soham Aggarwal"
 */
export function formatName(name: string | null | undefined): string {
  if (!name) return '';
  
  return name
    .split(/\s+/)
    .map(word => {
      if (word.length === 0) return word;
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

