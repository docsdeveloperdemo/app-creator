// Main JavaScript file for the A-Frame VR Experience

// Wait for the scene to load
document.addEventListener('DOMContentLoaded', function() {
    const scene = document.querySelector('a-scene');
    const loadingScreen = document.getElementById('loading-screen');
    const infoPanel = document.getElementById('info-panel');
    
    // Hide loading screen when scene is loaded
    if (scene.hasLoaded) {
        hideLoadingScreen();
    } else {
        scene.addEventListener('loaded', hideLoadingScreen);
    }
    
    function hideLoadingScreen() {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    }
    
    // Keyboard controls
    document.addEventListener('keydown', function(event) {
        switch(event.key.toLowerCase()) {
            case 'i':
                toggleInfo();
                break;
            case 'f':
                toggleFullscreen();
                break;
            case 'r':
                resetCameraPosition();
                break;
            case ' ':
                jumpCamera();
                break;
        }
    });
    
    // Add custom sound effects
    const clickSound = new Audio('https://cdn.aframe.io/360-image-gallery-boilerplate/audio/click.ogg');
    clickSound.volume = 0.3;
    
    // Add click sound to all interactive elements
    document.querySelectorAll('.interactive').forEach(element => {
        element.addEventListener('click', () => {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => console.log('Audio play failed:', e));
        });
    });
    
    // Performance optimization - reduce quality on mobile
    if (isMobile()) {
        scene.setAttribute('renderer', {
            antialias: false,
            maxCanvasWidth: 1920,
            maxCanvasHeight: 1920
        });
        
        // Reduce particle count on mobile
        const particleSystem = document.querySelector('[particle-system]');
        if (particleSystem) {
            particleSystem.setAttribute('particle-system', 'particleCount', 500);
        }
    }
    
    // Add touch controls for mobile
    if ('ontouchstart' in window) {
        addTouchControls();
    }
    
    // Create floating particles
    createFloatingParticles();
    
    // Add ambient sounds
    createAmbientSounds();
    
    // Monitor VR mode
    scene.addEventListener('enter-vr', function () {
        console.log('Entered VR mode');
        document.body.classList.add('vr-mode');
    });
    
    scene.addEventListener('exit-vr', function () {
        console.log('Exited VR mode');
        document.body.classList.remove('vr-mode');
    });
});

// Toggle info panel
function toggleInfo() {
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel.classList.contains('visible')) {
        infoPanel.classList.remove('visible');
    } else {
        infoPanel.classList.add('visible');
    }
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Reset camera position
function resetCameraPosition() {
    const camera = document.querySelector('[camera]');
    camera.setAttribute('position', '0 1.6 0');
    camera.setAttribute('rotation', '0 0 0');
    
    // Add a flash effect
    const flash = document.createElement('a-sphere');
    flash.setAttribute('radius', '100');
    flash.setAttribute('material', 'color: #FFF; opacity: 0.3; side: back');
    flash.setAttribute('position', '0 1.6 0');
    flash.setAttribute('animation', {
        property: 'material.opacity',
        to: 0,
        dur: 300
    });
    
    document.querySelector('a-scene').appendChild(flash);
    setTimeout(() => flash.remove(), 300);
}

// Jump camera
function jumpCamera() {
    const camera = document.querySelector('[camera]');
    const currentPos = camera.getAttribute('position');
    
    if (currentPos.y <= 1.7) {  // Only jump if near ground
        camera.setAttribute('animation__jump', {
            property: 'position.y',
            to: currentPos.y + 2,
            dur: 300,
            easing: 'easeOutQuad'
        });
        
        setTimeout(() => {
            camera.setAttribute('animation__fall', {
                property: 'position.y',
                to: 1.6,
                dur: 500,
                easing: 'easeInQuad'
            });
        }, 300);
    }
}

// Check if mobile device
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Add touch controls for mobile
function addTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe up to jump
        if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -50) {
            jumpCamera();
        }
    });
}

// Create floating particles effect
function createFloatingParticles() {
    const scene = document.querySelector('a-scene');
    const particleColors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#7B68EE'];
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('a-sphere');
        particle.setAttribute('radius', Math.random() * 0.1 + 0.05);
        particle.setAttribute('material', {
            color: particleColors[Math.floor(Math.random() * particleColors.length)],
            emissive: particleColors[Math.floor(Math.random() * particleColors.length)],
            emissiveIntensity: 0.5,
            opacity: 0.7
        });
        particle.setAttribute('position', {
            x: Math.random() * 20 - 10,
            y: Math.random() * 5 + 2,
            z: Math.random() * 20 - 15
        });
        
        // Floating animation
        particle.setAttribute('animation', {
            property: 'position.y',
            to: Math.random() * 5 + 5,
            dur: Math.random() * 5000 + 3000,
            easing: 'easeInOutSine',
            loop: true,
            dir: 'alternate'
        });
        
        // Rotation animation
        particle.setAttribute('animation__rotation', {
            property: 'rotation',
            to: '360 360 360',
            dur: Math.random() * 10000 + 5000,
            loop: true
        });
        
        scene.appendChild(particle);
    }
}

// Create ambient sound system
function createAmbientSounds() {
    // Note: Browsers require user interaction before playing audio
    // This will prepare the sounds but won't play until user interacts
    
    const ambientSounds = [
        { url: 'https://cdn.freesound.org/previews/316/316643_5123451-lq.mp3', volume: 0.1 },
        { url: 'https://cdn.freesound.org/previews/456/456156_9159316-lq.mp3', volume: 0.05 }
    ];
    
    // Create audio context on first user interaction
    document.addEventListener('click', function initAudio() {
        ambientSounds.forEach(sound => {
            const audio = new Audio(sound.url);
            audio.volume = sound.volume;
            audio.loop = true;
            audio.play().catch(e => console.log('Ambient audio not available:', e));
        });
        
        document.removeEventListener('click', initAudio);
    }, { once: true });
}

// Log scene statistics
setInterval(() => {
    const renderer = document.querySelector('a-scene').renderer;
    if (renderer && renderer.info) {
        console.log('Scene Stats:', {
            triangles: renderer.info.render.triangles,
            fps: renderer.info.render.fps
        });
    }
}, 5000);

// Easter egg: Konami code
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiPattern.join(',')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    console.log('🎉 Easter egg activated!');
    
    // Create a rainbow effect
    const scene = document.querySelector('a-scene');
    const rainbow = document.createElement('a-entity');
    rainbow.setAttribute('geometry', 'primitive: torus; radius: 10; radiusTubular: 0.5');
    rainbow.setAttribute('material', 'color: #FF0000; emissive: #FF0000; emissiveIntensity: 0.5');
    rainbow.setAttribute('position', '0 10 -10');
    rainbow.setAttribute('rotation', '90 0 0');
    rainbow.setAttribute('animation', {
        property: 'material.color',
        to: '#FF00FF',
        dur: 2000,
        loop: true,
        dir: 'alternate'
    });
    rainbow.setAttribute('animation__rotation', {
        property: 'rotation.z',
        to: 360,
        dur: 3000,
        loop: true
    });
    
    scene.appendChild(rainbow);
    
    setTimeout(() => rainbow.remove(), 10000);
}