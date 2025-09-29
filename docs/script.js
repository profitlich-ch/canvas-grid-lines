import { canvasGridLines, Units } from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisiere Canvas Grid Lines...');

    // Initialise on all elements that have a data-grid attribute
    // You may use any kind of selector
    canvasGridLines.initGrid({
        targets: '[data-grid]',    // selector
        columns: 29,               // columns (not lines)
        lineWidth: 4,              // line width
        units: Units.DevicePixel,  // physical pixels or layout pixels
        extend: true               // place middle of outer lines on the tagets’ edges
    });

    // Event-Listener for the button for showing hidden container
    const showButton = document.getElementById('show-hidden-btn');
    const hiddenDiv = document.getElementById('hidden-div');

    if (showButton && hiddenDiv) {
        showButton.addEventListener('click', () => {
            hiddenDiv.style.display = 'block';
            showButton.style.display = 'none';
        });
    }
});
