export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered: ', registration);
        },
        (registrationError) => {
          console.log('SW registration failed: ', registrationError);
        }
      );
    });
  }
};

export const unregisterSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
};