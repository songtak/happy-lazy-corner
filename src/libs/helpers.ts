/** 천단위 콤마 */
/**
 * num.toLocaleString()
 */
export const isMobile = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};
