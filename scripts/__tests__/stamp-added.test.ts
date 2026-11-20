import { describe, expect, it } from 'vitest';
import { stampAdded } from '../stamp-added';

const yaml = `icons:
  new-icon:
    category: 'ai'
    aliases: []
    added: 'unreleased'
  old-icon:
    category: 'ai'
    aliases: []
    added: '0.4.0'
`;

describe('stampAdded', () => {
  it('replaces only the unreleased placeholder with the version', () => {
    const { yaml: out, stamped } = stampAdded(yaml, '0.6.0');

    expect(stamped).toBe(1);
    expect(out).toContain("added: '0.6.0'");
    expect(out).toContain("added: '0.4.0'");
    expect(out).not.toContain('unreleased');
  });

  it('leaves the YAML unchanged when nothing is unreleased', () => {
    const released = yaml.replace("'unreleased'", "'0.5.0'");

    expect(stampAdded(released, '0.6.0')).toEqual({
      yaml: released,
      stamped: 0,
    });
  });
});
