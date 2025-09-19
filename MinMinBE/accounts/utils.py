from __future__ import annotations

"""Utility helpers for working with account-related access scopes."""

from typing import Optional

from accounts.models import User
from restaurant.branch.models import Branch
from restaurant.tenant.models import Tenant


def get_user_branch(user: User) -> Optional[Branch]:
    """Return the branch linked to the given user if available."""
    return getattr(user, "branch", None)


def get_user_tenant(user: User) -> Optional[Tenant]:
    """Return the tenant the user can administer or belongs to."""
    if user.user_type == "restaurant":
        return getattr(user, "tenants", None)

    if user.user_type == "branch":
        branch = get_user_branch(user)
        return branch.tenant if branch else None

    return None
