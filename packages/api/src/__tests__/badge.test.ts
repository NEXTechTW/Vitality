import { describe, it, expect } from 'vitest';
import { scoreColor, grade, buildSvg } from '../routes/badge.js';

describe('badge generator', () => {
  it('assigns green for score >= 90', () => {
    expect(scoreColor(95)).toBe('#22c55e');
    expect(grade(95)).toBe('A');
  });

  it('assigns red for failing score', () => {
    expect(scoreColor(35)).toBe('#ef4444');
    expect(grade(35)).toBe('D');
  });

  it('generates valid SVG with score and grade', () => {
    const svg = buildSvg('test', 'repo', 92);
    expect(svg).toContain('<svg');
    expect(svg).toContain('92/100');
    expect(svg).toContain('A');
    expect(svg).toContain('</svg>');
  });

  it('handles unknown/null score gracefully', () => {
    const svg = buildSvg('test', 'repo', null);
    expect(svg).toContain('unknown');
    expect(svg).toContain('?');
  });
});
