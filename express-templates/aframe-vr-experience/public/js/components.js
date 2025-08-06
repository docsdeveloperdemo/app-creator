// Register custom A-Frame components

// Color changer component
AFRAME.registerComponent('color-changer', {
    init: function() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#85C88A'];
        let currentIndex = 0;
        
        this.el.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % colors.length;
            this.el.setAttribute('material', 'color', colors[currentIndex]);
            
            // Add a pulse animation
            this.el.setAttribute('animation__pulse', {
                property: 'scale',
                to: '1.5 1.5 1.5',
                dur: 200,
                easing: 'easeOutQuad'
            });
            
            setTimeout(() => {
                this.el.setAttribute('animation__pulse', {
                    property: 'scale',
                    to: '1 1 1',
                    dur: 200,
                    easing: 'easeInQuad'
                });
            }, 200);
        });
    }
});

// Clickable component for better interaction
AFRAME.registerComponent('clickable', {
    init: function() {
        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'emissive', '#FFF');
            this.el.setAttribute('material', 'emissiveIntensity', '0.2');
        });
        
        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'emissiveIntensity', '0');
        });
        
        this.el.addEventListener('click', () => {
            // Create a ripple effect
            const ripple = document.createElement('a-sphere');
            ripple.setAttribute('radius', '0.1');
            ripple.setAttribute('material', 'opacity: 0.5; color: #FFF');
            ripple.setAttribute('position', '0 0 0');
            ripple.setAttribute('animation', {
                property: 'scale',
                to: '5 5 5',
                dur: 1000,
                easing: 'easeOutQuad'
            });
            ripple.setAttribute('animation__opacity', {
                property: 'material.opacity',
                to: 0,
                dur: 1000,
                easing: 'easeOutQuad'
            });
            
            this.el.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 1000);
        });
    }
});

// Portal effect component
AFRAME.registerComponent('portal-effect', {
    init: function() {
        this.el.addEventListener('click', () => {
            // Teleport the camera
            const camera = document.querySelector('[camera]');
            const currentPos = camera.getAttribute('position');
            const newPos = {
                x: Math.random() * 10 - 5,
                y: currentPos.y,
                z: Math.random() * 10 - 15
            };
            
            // Add flash effect
            const flash = document.createElement('a-sphere');
            flash.setAttribute('radius', '100');
            flash.setAttribute('material', 'color: #FFF; opacity: 0.8; side: back');
            flash.setAttribute('position', camera.getAttribute('position'));
            flash.setAttribute('animation', {
                property: 'material.opacity',
                to: 0,
                dur: 500,
                easing: 'easeOutQuad'
            });
            
            document.querySelector('a-scene').appendChild(flash);
            
            setTimeout(() => {
                camera.setAttribute('position', newPos);
                flash.remove();
            }, 250);
        });
        
        // Add glow effect
        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'emissive', '#9B59B6');
            this.el.setAttribute('material', 'emissiveIntensity', '0.5');
        });
        
        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'emissiveIntensity', '0');
        });
    }
});

// Tile interaction component
AFRAME.registerComponent('tile-interaction', {
    init: function() {
        const originalColor = this.el.getAttribute('color');
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
        
        this.el.addEventListener('click', () => {
            // Jump animation
            const currentY = this.el.object3D.position.y;
            this.el.setAttribute('animation__jump', {
                property: 'position.y',
                to: currentY + 0.5,
                dur: 200,
                easing: 'easeOutQuad'
            });
            
            setTimeout(() => {
                this.el.setAttribute('animation__fall', {
                    property: 'position.y',
                    to: currentY,
                    dur: 200,
                    easing: 'easeInQuad'
                });
            }, 200);
            
            // Change color
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.el.setAttribute('color', randomColor);
            
            // Reset color after 2 seconds
            setTimeout(() => {
                this.el.setAttribute('color', originalColor);
            }, 2000);
        });
        
        this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('material', 'emissive', this.el.getAttribute('color'));
            this.el.setAttribute('material', 'emissiveIntensity', '0.3');
        });
        
        this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('material', 'emissiveIntensity', '0');
        });
    }
});

// Light toggle component
AFRAME.registerComponent('light-toggle', {
    init: function() {
        let lightOn = false;
        const light = document.querySelector('#dynamic-light');
        
        this.el.addEventListener('click', () => {
            lightOn = !lightOn;
            
            if (lightOn) {
                light.emit('lighton');
                this.el.setAttribute('material', 'emissive', '#FFFF00');
                this.el.setAttribute('material', 'emissiveIntensity', '0.5');
                
                // Change environment to night
                document.querySelector('[environment]').setAttribute('environment', 'preset: starry');
            } else {
                light.emit('lightoff');
                this.el.setAttribute('material', 'emissiveIntensity', '0');
                
                // Change environment back to forest
                document.querySelector('[environment]').setAttribute('environment', 'preset: forest');
            }
            
            // Animate the switch
            this.el.setAttribute('animation__flip', {
                property: 'rotation.x',
                to: lightOn ? 180 : 0,
                dur: 300,
                easing: 'easeInOutQuad'
            });
        });
    }
});

// Gradient sky shader
AFRAME.registerShader('gradient', {
    schema: {
        topColor: {type: 'color', default: '#1e3c72'},
        bottomColor: {type: 'color', default: '#2a5298'}
    },
    
    vertexShader: [
        'varying vec3 vWorldPosition;',
        'void main() {',
        '  vec4 worldPosition = modelMatrix * vec4(position, 1.0);',
        '  vWorldPosition = worldPosition.xyz;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n'),
    
    fragmentShader: [
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'varying vec3 vWorldPosition;',
        'void main() {',
        '  float h = normalize(vWorldPosition).y;',
        '  gl_FragColor = vec4(mix(bottomColor, topColor, max(0.0, h)), 1.0);',
        '}'
    ].join('\n')
});