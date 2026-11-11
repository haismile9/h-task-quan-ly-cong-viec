/**
 * Dropdown của daisyUI mở theo focus, nên phải bỏ focus để đóng nó
 * sau khi người dùng chọn một mục.
 */
export const closeDropdown = () => (document.activeElement as HTMLElement | null)?.blur();
