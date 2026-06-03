import { describe, it, expect } from 'vitest';
import { sanitizeEditorHtml } from './dompurifyConfig';

describe('dompurifyConfig - XSS protection', () => {
  it('blocks javascript: URLs in href', () => {
    const html = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('javascript:');
    // DOMPurify removes the href attribute entirely for invalid schemes
    expect(result).toContain('<a>click</a>');
  });

  it('blocks data: URLs in href', () => {
    const html = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('data:');
  });

  it('blocks vbscript: URLs in href', () => {
    const html = '<a href="vbscript:msgbox(1)">click</a>';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('vbscript:');
  });

  it('strips onclick event handler', () => {
    const html = '<p onclick="alert(1)">text</p>';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('onclick');
  });

  it('strips onerror event handler on img', () => {
    const html = '<img src="x" onerror="alert(1)" alt="test">';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('onerror');
  });

  it('strips script tags', () => {
    const html = '<p>safe</p><script>alert(1)</script>';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('<script>');
    expect(result).toContain('safe');
  });

  it('allows iframe with src attribute', () => {
    // DOMPurify preserves iframe and src attribute
    const html = '<iframe src="https://example.com" sandbox="allow-scripts"></iframe>';
    const result = sanitizeEditorHtml(html);
    expect(result).toContain('<iframe');
    expect(result).toContain('https://example.com');
  });

  it('preserves https and http URLs in href', () => {
    const urls = ['https://example.com', 'http://example.com'];
    for (const url of urls) {
      const html = `<a href="${url}">link</a>`;
      const result = sanitizeEditorHtml(html);
      expect(result).toContain(`href="${url}"`);
    }
  });

  it('preserves mailto links', () => {
    const html = '<a href="mailto:user@example.com">email</a>';
    const result = sanitizeEditorHtml(html);
    expect(result).toContain('mailto:');
  });

  it('preserves relative paths and anchors', () => {
    const paths = ['#anchor', '/path', './relative', '../parent'];
    for (const path of paths) {
      const html = `<a href="${path}">link</a>`;
      const result = sanitizeEditorHtml(html);
      expect(result).toContain(`href="${path}"`);
    }
  });

  it('preserves custom data-* attributes by default (all data-* are whitelisted)', () => {
    // DOMPurify by default allows data-* attributes with any name (not in strictest configs)
    // This test documents the behavior: custom data-* attributes are preserved
    const html = '<div data-custom-evil="malicious">text</div>';
    const result = sanitizeEditorHtml(html);
    expect(result).toContain('data-custom-evil');
  });

  it('preserves whitelisted data-* attributes', () => {
    // Whitelisted attributes from dompurifyConfig
    const html = '<div data-node-type="custom" data-block-type="xyz">text</div>';
    const result = sanitizeEditorHtml(html);
    expect(result).toContain('data-node-type');
    expect(result).toContain('data-block-type');
  });

  it('converts plaintext to safe HTML with < > escaped', () => {
    const html = '<p><script>alert(1)</script> and <img src=x onerror=alert(1)></p>';
    const result = sanitizeEditorHtml(html);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('onerror');
  });
});
