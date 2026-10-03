import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {Button} from './Button';

describe('Button server markup', () => {
  it('disables a loading action and announces its busy state', () => {
    const html = renderToStaticMarkup(<Button loading>Submit</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Loading…');
    expect(html).toContain('Submit');
  });

  it('keeps an explicitly disabled action disabled', () => {
    const html = renderToStaticMarkup(<Button disabled>Save</Button>);
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('aria-busy');
  });
});
