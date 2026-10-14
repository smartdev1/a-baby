/**
 * Role: maps an async stream through an async function with a bounded number of jobs in flight, consuming the results strictly in input order (deterministic outputs, bounded memory).
 * Owner: backend
 */

type Settled<O> = { readonly ok: true; readonly value: O } | { readonly ok: false; readonly error: unknown };

export const mapOrdered = async <I, O>(
  items: AsyncIterable<I> | Iterable<I>,
  work: (item: I) => Promise<O>,
  consume: (output: O, item: I) => Promise<void> | void,
  maxInFlight: number,
): Promise<void> => {
  const window: { readonly item: I; readonly result: Promise<Settled<O>> }[] = [];
  const drainOne = async (): Promise<void> => {
    const head = window.shift();
    if (!head) return;
    const settled = await head.result;
    if (!settled.ok) throw settled.error;
    await consume(settled.value, head.item);
  };
  for await (const item of items) {
    // Settle every job at once so a failure never becomes an unhandled rejection while it waits in the window.
    window.push({ item, result: work(item).then((value): Settled<O> => ({ ok: true, value }), (error: unknown): Settled<O> => ({ ok: false, error })) });
    if (window.length >= maxInFlight) await drainOne();
  }
  while (window.length > 0) await drainOne();
};
