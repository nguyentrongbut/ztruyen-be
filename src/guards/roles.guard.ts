// ** NestJs
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ** Decorator
import { ROLES_KEY } from '../decorator/roles.decorator';

// ** Messages
import { AUTH_MESSAGES } from '../configs/messages/auth.message';

// ** Enums
import { RoleType } from '../configs/enums/user.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException(AUTH_MESSAGES.UNAUTHORIZED);
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(AUTH_MESSAGES.PERMISSION_DENIED);
    }

    return true;
  }
}
