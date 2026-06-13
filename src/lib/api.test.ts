import { describe, expect, it } from 'vitest';

import { apiError, apiSuccess } from './api';

describe('apiSuccess', () => {
  it('wraps data in a success envelope with a timestamp', () => {
    const res = apiSuccess({ value: 42 });
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ value: 42 });
    expect(() => new Date(res.timestamp)).not.toThrow();
  });
});

describe('apiError', () => {
  it('wraps a code and message in an error envelope', () => {
    const res = apiError('BAD_REQUEST', 'nope');
    expect(res.success).toBe(false);
    expect(res.error).toEqual({ code: 'BAD_REQUEST', message: 'nope' });
  });
});
