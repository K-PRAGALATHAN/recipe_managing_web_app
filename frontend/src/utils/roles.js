const normalize = (value) => String(value ?? '').trim().toLowerCase();

export function toUiRole(role) {
  const r = normalize(role);
  if (r === 'manager' || r === 'admin') return 'Manager';
  if (r === 'chef') return 'Chef';
  if (r === 'cook') return 'Cook';
  return null;
}

export function toUiRoleOrDefault(role, fallback = 'Cook') {
  return toUiRole(role) ?? fallback;
}

export function isManagerRole(role) {
  return toUiRole(role) === 'Manager';
}

