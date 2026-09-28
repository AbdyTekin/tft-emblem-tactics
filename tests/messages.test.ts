import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import en from '@/messages/en.json';
import tr from '@/messages/tr.json';

function keys(messages: Record<string, unknown>, prefix = ''): string[] {
    return Object.entries(messages).flatMap(([key, value]) =>
        value && typeof value === 'object' ? keys(value as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`]);
}

describe('UI messages', () => {
    it('has the same keys in English and Turkish', () => {
        assert.deepEqual(keys(tr).sort(), keys(en).sort());
    });

    it('has no empty strings', () => {
        for (const [lang, messages] of [['en', en], ['tr', tr]] as const) {
            for (const key of keys(messages)) {
                const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages);
                assert.ok(typeof value === 'string' && value.trim(), `${lang}: ${key} is empty`);
            }
        }
    });
});
