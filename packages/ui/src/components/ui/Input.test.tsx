import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {Input} from './Input';

describe('Input server markup', () => {
  it('marks validation errors for assistive technology', () => {
    const html = renderToStaticMarkup(<Input aria-label="Email" error />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-label="Email"');
  });

  it('does not announce an error for a valid field', () => {
    const html = renderToStaticMarkup(<Input aria-label="Email" />);
    expect(html).not.toContain('aria-invalid');
    expect(html).toContain('type="text"');
  });
});
