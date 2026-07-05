import { describe, it, expect } from 'vitest';
import { sanitizeUrl, sanitizeImageSrc } from '@domain/shared/url';

describe('sanitizeUrl', () => {
  it('allows http(s), mailto, tel and relative links', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('HTTP://EXAMPLE.com')).toBe('HTTP://EXAMPLE.com');
    expect(sanitizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(sanitizeUrl('tel:+123')).toBe('tel:+123');
    expect(sanitizeUrl('#section')).toBe('#section');
    expect(sanitizeUrl('/path')).toBe('/path');
    expect(sanitizeUrl('./rel')).toBe('./rel');
  });

  it('blocks javascript: and its obfuscations', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('  javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBeNull();
    expect(sanitizeUrl('java\tscript:alert(1)')).toBeNull(); // tab obfuscation
    expect(sanitizeUrl('java\nscript:alert(1)')).toBeNull();
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull(); // control-char prefix
  });

  it('blocks vbscript:, data: and protocol-relative for links', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeUrl('//evil.com')).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl(42)).toBeNull();
  });
});

describe('sanitizeImageSrc', () => {
  it('allows http(s), blob and image data URLs', () => {
    expect(sanitizeImageSrc('https://x/y.png')).toBe('https://x/y.png');
    expect(sanitizeImageSrc('blob:https://x/abc')).toBe('blob:https://x/abc');
    expect(sanitizeImageSrc('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    expect(sanitizeImageSrc('data:image/svg+xml;utf8,<svg/>')).toBe('data:image/svg+xml;utf8,<svg/>');
  });

  it('blocks non-image data URLs and scripts', () => {
    expect(sanitizeImageSrc('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeImageSrc('javascript:alert(1)')).toBeNull();
    expect(sanitizeImageSrc('')).toBeNull();
    expect(sanitizeImageSrc(undefined)).toBeNull();
  });
});
