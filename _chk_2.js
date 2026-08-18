
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
          .catch(function(err){ console.warn('[PWA] SW register failed:', err); });
      });
    }
  
