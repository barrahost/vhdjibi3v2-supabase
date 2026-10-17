// Les SMS sont facturés par segment : 160 caractères en alphabet GSM, 70 dès qu'un seul caractère
// n'en fait pas partie (guillemets « », tirets longs, accents comme ê ou ç…). Ce texte est donc
// ramené à l'alphabet GSM et plafonné à un segment.

const GSM_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

const REPLACEMENTS: [RegExp, string][] = [
  [/[‘’´`]/g, "'"],
  [/[“”«»]/g, '"'],
  [/[–—−]/g, '-'],
  [/…/g, '...'],
  [/[  ]/g, ' '],
  [/œ/g, 'oe'],
  [/Œ/g, 'OE'],
];

export function toSmsText(text: string, maxLength = 160): string {
  let result = REPLACEMENTS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
  result = Array.from(result)
    .map((char) => {
      if (GSM_BASIC.includes(char)) return char;
      const plain = char.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return plain && GSM_BASIC.includes(plain) ? plain : '?';
    })
    .join('');
  return result.length > maxLength ? `${result.slice(0, maxLength - 3).trimEnd()}...` : result;
}
