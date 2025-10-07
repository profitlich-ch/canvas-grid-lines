import { canvasGridLines } from './index.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialising Canvas Grid Lines...');

    // Initialise on all elements that have a data-grid-type attribute
    // You may use any kind of selector or even pass a single HTMLElement
    canvasGridLines.initGrid({
        targets: '[data-grid-type]',
        columns: 20,
        lineWidth: 4,
        units: 'devicepixel',
        extend: true
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
