const commentCache = new Map()

export function checkSpam(userId: string) {

  const now = Date.now()

  const last = commentCache.get(userId)

  if (last && now - last < 5000) {
    throw new Error('You are commenting too fast')
  }

  commentCache.set(userId, now)

}