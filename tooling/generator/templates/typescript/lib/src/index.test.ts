import { describe, it, expect } from 'vitest';
import { greet, version } from './index.js';

describe('{{name}}', () => {
  it('should greet', () => {
    expect(greet('world')).toContain('world');
  });

  it('should have a version', () => {
    expect(version()).toBe('1.0.0');
  });
});
