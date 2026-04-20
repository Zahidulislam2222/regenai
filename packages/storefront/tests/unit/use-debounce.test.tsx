import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useDebouncedCallback} from '~/lib/use-debounce';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('fires the callback after delay — not before', () => {
    const cb = vi.fn();
    const {result} = renderHook(() => useDebouncedCallback(cb, 250));

    act(() => result.current('hello'));
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(cb).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('hello');
  });

  it('resets the timer on each invocation (trailing edge)', () => {
    const cb = vi.fn();
    const {result} = renderHook(() => useDebouncedCallback(cb, 250));

    act(() => result.current('a'));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current('b'));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current('c'));
    act(() => vi.advanceTimersByTime(249));
    expect(cb).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('c');
  });

  it('fires with the latest callback reference when it changes mid-flight', () => {
    const first = vi.fn();
    const second = vi.fn();
    const {result, rerender} = renderHook(
      ({fn}: {fn: () => void}) => useDebouncedCallback(fn, 250),
      {initialProps: {fn: first}},
    );

    act(() => result.current());
    rerender({fn: second});

    act(() => vi.advanceTimersByTime(250));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('clears pending timers on unmount', () => {
    const cb = vi.fn();
    const {result, unmount} = renderHook(() => useDebouncedCallback(cb, 250));

    act(() => result.current());
    unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(cb).not.toHaveBeenCalled();
  });

  it('default delay is 250ms', () => {
    const cb = vi.fn();
    const {result} = renderHook(() => useDebouncedCallback(cb));

    act(() => result.current());
    act(() => vi.advanceTimersByTime(249));
    expect(cb).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
