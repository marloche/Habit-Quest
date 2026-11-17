// Drag to reorder a list: hold a row's grip, move, let go. Pointer events cover mouse, touch and pen alike.
// The held row never moves in the page while it's held (moving the element under the finger can drop the pointer
// capture); its neighbours step past it instead, and a transform keeps it under the finger.

const EDGE = 72; // px from the top of the screen, or from the tab bar, where the page starts to scroll
const SPEED = 0.9; // px a millisecond at the very edge (by time, so a 144 Hz screen scrolls no faster than a 60 Hz one)

let held = false;
export const isDragging = () => held;

// drop gets the row's place before and after (the same place if the drag was cancelled). The list is left in its
// dragged order; the caller redraws it from the save either way.
export function dragRow(e: PointerEvent, grip: HTMLElement, drop: (from: number, to: number) => void): void {
  const row = grip.closest<HTMLElement>('li');
  const list = row?.parentElement;
  if (held || !row || !list || !e.isPrimary || e.button !== 0) return;
  // No preventDefault: the press focuses the grip like any button (no focus ring for a mouse or finger), so keys
  // never go to a quest focused earlier. CSS stops text selection (user-select) and page scrolling (touch-action).
  held = true;
  const from = [...list.children].indexOf(row);
  const margin = parseFloat(getComputedStyle(row).marginTop) || 0;
  const grab = e.clientY - row.getBoundingClientRect().top; // where on the row it was taken
  let y = e.clientY;
  let dy = 0; // the row's transform
  let frame = 0;
  let last = 0; // the previous frame's time
  const middle = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top + r.height / 2;
  };

  const place = () => {
    const box = list.getBoundingClientRect();
    const h = row.offsetHeight;
    const top = Math.max(box.top + margin, Math.min(box.bottom - margin - h, y - grab)); // kept inside the list
    // A neighbour steps past once the row's leading edge crosses its middle (middle against middle can't reach the
    // ends: kept inside the list, a row's middle never passes the first or last row's). A flick can pass several.
    for (let n = list.children.length; n > 0; n--) {
      const prev = row.previousElementSibling;
      const next = row.nextElementSibling;
      if (prev && top < middle(prev)) list.insertBefore(prev, row.nextSibling);
      else if (next && top + h > middle(next)) list.insertBefore(next, row);
      else break;
    }
    dy += top - row.getBoundingClientRect().top;
    row.style.transform = `translateY(${dy}px)`;
  };

  // Near the top, or near the tab bar, the page scrolls; faster the closer you get.
  const scroll = (t: number) => {
    const ms = last ? Math.min(t - last, 50) : 0; // capped, so a stalled frame doesn't jump the page
    last = t;
    const floor = (document.querySelector('.tabs')?.getBoundingClientRect().top ?? innerHeight) - EDGE;
    const into = y < EDGE ? y - EDGE : y > floor ? y - floor : 0;
    if (into && ms) {
      const was = scrollY;
      scrollBy(0, Math.sign(into) * Math.ceil(Math.min(1, Math.abs(into) / EDGE) * SPEED * ms));
      if (scrollY !== was) place();
    }
    frame = requestAnimationFrame(scroll);
  };

  const move = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId) return;
    y = ev.clientY;
    place();
  };
  const end = (ev: PointerEvent) => {
    if (ev.pointerId !== e.pointerId || !held) return;
    held = false;
    cancelAnimationFrame(frame);
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', end);
    removeEventListener('pointercancel', end);
    grip.removeEventListener('lostpointercapture', end);
    row.classList.remove('dragging');
    row.style.transform = '';
    document.body.classList.remove('row-dragging');
    drop(from, ev.type === 'pointercancel' ? from : [...list.children].indexOf(row)); // cancelled (say, a system swipe): it goes back
  };

  try {
    grip.setPointerCapture(e.pointerId); // moves keep coming here even off the grip
  } catch {
    // no live pointer (a scripted test): the window listeners below still see every move
  }
  row.classList.add('dragging');
  document.body.classList.add('row-dragging');
  addEventListener('pointermove', move);
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
  grip.addEventListener('lostpointercapture', end);
  frame = requestAnimationFrame(scroll);
}
