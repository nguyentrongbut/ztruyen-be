import { BadRequestException } from '@nestjs/common';

const commentCache = new Map<string, number>()

export function checkSpam(userId: string): void {
  const now = Date.now()
  const last = commentCache.get(userId)

  if (last && now - last < 5000) {
    throw new BadRequestException('You are commenting too fast')
  }

  commentCache.set(userId, now)
}