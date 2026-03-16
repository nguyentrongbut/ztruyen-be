export const badWords = [
  'fuck',
  'shit',
  'ngu',
  'dm',
];

export function filterBadWords(text: string) {

  badWords.forEach((word) => {

    const reg = new RegExp(word, 'gi');

    text = text.replace(reg, '***');

  });

  return text;
}