/**
 * Thermal receipt printing. Sets the print page to a continuous roll of the
 * given width (80mm by default, 58mm for smaller printers) with zero margins,
 * so the receipt prints edge-to-edge on the roll instead of on an A4 page.
 */
export function printReceipt(widthMm: 80 | 58 = 80): void {
  if (typeof window === 'undefined') return;

  const style = document.createElement('style');
  style.id = 'thermal-page-size';
  style.media = 'print';
  style.textContent = `@page { size: ${widthMm}mm auto; margin: 0; }`;
  document.head.appendChild(style);

  const cleanup = () => {
    style.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  window.print();
  // Fallback for browsers that don't fire afterprint reliably.
  setTimeout(cleanup, 1500);
}
