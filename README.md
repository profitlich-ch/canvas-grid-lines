# canvas-grid-lines

![npm](https://img.shields.io/npm/v/canvas-grid-lines.svg) ![license](https://img.shields.io/npm/l/canvas-grid-lines.svg) ![github-issues](https://img.shields.io/github/issues/profitlich-ch/canvas-grid-lines.svg)  !

Draws grid lines as HTML canvas element (baseline, squared and more) 

![stars](https://img.shields.io/github/stars/profitlich-ch/canvas-grid-lines.svg)
![forks](https://img.shields.io/github/forks/profitlich-ch/canvas-grid-lines.svg)


## Features

- **Multiple grid types available**:
  - baseline (horizontal lines)
  - squared (horizontal and vertical lines)
  - columns (vertical lines showing columns with gaps)
  - rows (vertical lines for columns without gaps and horizontal lines)

- **Retina/high res**: The grid is automatically adapted to the screen’s resolution and redrawn any time the window is resized.

- **Crisp and precise**: The grid lines are set precisely onto the physical pixels of the screen thus they are always crisp. This distinguishes them from lines shown by SVG background images or drawn with CSS gradients.

- **Column count updatable**: Already drawn grids may be updated with a new grid count.

- **Self-placing**: A html `canvas` element will be added automatically to all html elements the script is applied to. If the given elements have no css `position`, `position: relative` will be added automatically.


## Installation

```
npm install --save canvas-grid-lines
```

## Usage

### HTML 
```html
<div data-grid="squared"></div>
```


### Initialize the grid(s)
```javascript
import { canvasGridLines } from 'canvas-grid-lines';

let grids = canvasGridLines.initGrid(
    '[data-grid]',
    59,
    1,
    canvasGridLines.Units.LayoutPixel,
    false,
    '#000000'
);
```

### Updating the columnCount
The grid will be redrawn automatically
```javascript
canvasGridLines.setColumns(29);
```


## Configuration
### HTML elements to be used
Any `querySelectorAll`-compatible selector may be given. In the example code above the data attribute needed for the grid type is used.

### Grid Type
The grid type is read from a mandatory data attribute `data-grid`and may be of the following values: `baseline`, `squared`, `columns`, `rows`

### Line width
Line width as integer or float.

### Units (optional, default: LayoutPixel)
The units parameter tells the script how to interpret the line width: either layout size (as in CSS) or physical pixels.

### Extend (optional, default: false)
Lines are always drawn onto the center of the grid calculated with zero line width. The sides of thicker lines thus protrude the html element. This parameter controls whether the ends of lines will also be extended. 

### Color (optional, default: black)
A [CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) setting the lines’ color.


## License

 - **ISC** : http://opensource.org/licenses/ISC

## Keyword 