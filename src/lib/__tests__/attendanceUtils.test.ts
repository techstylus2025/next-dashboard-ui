import { describe, it, expect } from 'vitest';
import { getInitials, avatarColor } from '../attendanceUtils';

describe('attendanceUtils', () => {
  it('generates initials for single and multi-part names', () => {
    expect(getInitials('Ada')).toBe('AD');
    expect(getInitials('Ada Lovelace')).toBe('AL');
    expect(getInitials('   ')).toBe('');
  });

  it('returns one of the allowed tailwind color classes', () => {
    const colors = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-yellow-500", "bg-violet-500"];
    const c = avatarColor('Ada Lovelace');
    expect(colors).toContain(c);
  });
});
