'use client';
import { useState } from 'react';

export default function Page() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  return <main>
    <h1>Project review</h1>
    <aside data-callout>Review the exact scope before approving a change.</aside>
    <button type="button" onClick={() => setCount(value => value + 1)}>Record review</button>
    <output role="status">Reviews recorded: {count}</output>
    <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>Supporting context</summary>
      <p>React owns state; native details remains keyboard operable.</p>
    </details>
    <label data-field>Project name<input defaultValue="Community garden" /></label>
  </main>;
}
