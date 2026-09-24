export function focusFirstInvalid(container: HTMLElement | null) {
  requestAnimationFrame(() => {
    container?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
