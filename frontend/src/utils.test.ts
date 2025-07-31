import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('combines class names correctly', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'not-included');
      expect(result).toBe('base conditional');
    });

    it('handles undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('handles empty strings', () => {
      const result = cn('base', '', 'valid');
      expect(result).toBe('base valid');
    });
  });
});