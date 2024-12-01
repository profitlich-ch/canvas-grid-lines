# canvas-grid-lines

![npm](https://img.shields.io/npm/v/canvas-grid-lines.svg) ![license](https://img.shields.io/npm/l/canvas-grid-lines.svg) ![github-issues](https://img.shields.io/github/issues/profitlich-ch/canvas-grid-lines.svg)  !

Draws grid lines as HTML canvas element (baseline, squared and more) 

![stars](https://img.shields.io/github/stars/profitlich-ch/canvas-grid-lines.svg)
![forks](https://img.shields.io/github/forks/profitlich-ch/canvas-grid-lines.svg)


## Install

````
npm install --save canvas-grid-lines
````


## Features

- **Multiple grid types available**:
  - baseline (horizontal lines)
  - squared (horizontal and vertical lines)
  - columns (vertical lines showing columns with gaps)
  - rows (vertical lines for columns without gaps and horizontal lines)

- **Retina/high res**: The grid is automatically adapted to the screen’s resolution and redrawn any time the window is resized.

- **Crisp and precise**: The grid lines are set precisely onto the physical pixels of the screen thus they are always crisp. This distinguishes them from lines shown by SVG background images or drawn with CSS gradients.

- **Column count updatable**: Already drawn grids may be updated with a new grid count.


# Example

````
import { canvasGridLines } from 'canvas-grid-lines';

// querySelectorAll-compatible selector and columnCount
let grids = canvasGridLines.initGrid('[data-grid]', 59);

// The columnCount may be updated, the grid will be redrawn automatically
canvasGridLines.setColumns(29);
````


# License

 - **ISC** : http://opensource.org/licenses/ISC

## Keyword 