import type { Ref } from 'vue';

const openDialogs: HTMLElement[] = [];
let previousOverflow = '';
const focusableSelector = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export const useDialogAccessibility = (element: Ref<HTMLElement | null>, isOpen: () => boolean, close: () => void) => {
  let activeElement: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  const focusables = () => Array.from(activeElement?.querySelectorAll<HTMLElement>(focusableSelector) || [])
    .filter(node => node.getClientRects().length > 0 && !node.closest('[inert]'));
  const isTop = () => activeElement && openDialogs.at(-1) === activeElement;
  const focusFirst = () => (focusables()[0] || activeElement)?.focus();
  const onKeydown = (event: KeyboardEvent) => {
    if (!isTop()) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const nodes = focusables();
    const first = nodes[0];
    const last = nodes.at(-1);
    if (!first) { event.preventDefault(); activeElement?.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === activeElement)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };
  const onFocus = (event: FocusEvent) => {
    if (isTop() && event.target instanceof Node && !activeElement?.contains(event.target)) focusFirst();
  };
  const release = () => {
    if (!activeElement) return;
    const wasTop = isTop();
    const index = openDialogs.indexOf(activeElement);
    if (index >= 0) openDialogs.splice(index, 1);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focusin', onFocus);
    activeElement = null;
    if (openDialogs.length === 0) document.body.style.overflow = previousOverflow;
    if (wasTop && previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
  };
  watch(isOpen, async (open) => {
    if (!import.meta.client) return;
    if (!open) { release(); return; }
    await nextTick();
    if (!isOpen() || !element.value || activeElement) return;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeElement = element.value;
    if (openDialogs.length === 0) previousOverflow = document.body.style.overflow;
    openDialogs.push(activeElement);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('focusin', onFocus);
    focusFirst();
  }, { immediate: true, flush: 'post' });
  onBeforeUnmount(release);
};
