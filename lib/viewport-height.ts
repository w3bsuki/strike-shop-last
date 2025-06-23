// Dynamic viewport height calculation for mobile devices
export function setViewportHeight() {
  // First we get the viewport height and multiply it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Initialize and add event listeners
export function initViewportHeight() {
  if (typeof window === 'undefined') return;
  
  // Set initial value
  setViewportHeight();
  
  // Update on resize (debounced)
  let resizeTimeout: NodeJS.Timeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(setViewportHeight, 100);
  });
  
  // Update on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(setViewportHeight, 100);
  });
}