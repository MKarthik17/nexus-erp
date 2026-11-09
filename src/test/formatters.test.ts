import { describe, it, expect } from 'vitest';
import { formatMinorCurrency, formatNumber, formatDate } from '@/shared/utils/formatters';

describe('Financial & Utility Formatters', () => {
  it('formats minor currency units safely into USD strings', () => {
    expect(formatMinorCurrency(100000)).toBe('$1,000.00');
    expect(formatMinorCurrency(45050)).toBe('$450.50');
    expect(formatMinorCurrency(0)).toBe('$0.00');
  });

  it('formats regular numbers with thousand separators', () => {
    expect(formatNumber(1250000)).toBe('1,250,000');
    expect(formatNumber(42)).toBe('42');
  });

  it('formats dates consistently', () => {
    expect(formatDate('2026-11-09')).toContain('2026');
  });
});
