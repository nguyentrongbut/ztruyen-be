const BAD_WORDS = [
  'dm',
  'dit',
  'me may',
  'vai lon'
]

export function filterBadWords(content: string) {

  let result = content

  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    result = result.replace(regex, '***')
  })

  return result
}