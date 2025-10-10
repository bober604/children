let timerId = null;
let startTime = 0;
let remaining = 0;
let isRunning = false;

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch(type) {
        case 'START':
            remaining = data.remainingSeconds;
            startTime = Date.now();
            isRunning = true;
            
            timerId = setInterval(() => {
                if (isRunning) {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const currentRemaining = Math.max(0, remaining - elapsed);
                    
                    self.postMessage({
                        type: 'TICK',
                        remaining: currentRemaining
                    });
                    
                    if (currentRemaining <= 0) {
                        clearInterval(timerId);
                        self.postMessage({ type: 'COMPLETED' });
                    }
                }
            }, 1000);
            break;
            
        case 'PAUSE':
            isRunning = false;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            remaining = Math.max(0, remaining - elapsed);
            break;
            
        case 'RESUME':
            isRunning = true;
            startTime = Date.now();
            break;
            
        case 'STOP':
            isRunning = false;
            if (timerId) clearInterval(timerId);
            break;
            
        case 'UPDATE':
            remaining = data.remainingSeconds;
            startTime = Date.now();
            break;
    }
};