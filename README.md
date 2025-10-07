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


## Demo

Demo available at [https://profitlich-ch.github.io/canvas-grid-lines/](https://profitlich-ch.github.io/canvas-grid-lines/)


## Installation

```
npm install --save canvas-grid-lines
```

## Usage

The package supports modern ES Modules (ESM) for browsers and bundlers, legacy CommonJS (CJS) for Node.js, and comes with TypeScript types.

### Direct Browser / CDN Usage
For simple HTML projects, you can use a CDN like unpkg or copy the JS and CSS file from the `dist/umd` folder.

Add the following scripts and stylesheets to your HTML `<head>`:
```html
<head>
  <!-- Load the stylesheet -->
  <link rel="stylesheet" href="[https://unpkg.com/canvas-grid-lines/dist/canvas-grid-lines.css](https://unpkg.com/canvas-grid-lines/dist/canvas-grid-lines.css)">
  
  <!-- Load the script -->
  <script defer src="[https://unpkg.com/canvas-grid-lines/dist/umd/canvas-grid-lines.js](https://unpkg.com/canvas-grid-lines/dist/umd/canvas-grid-lines.js)"></script>
</head>
```
Then, in a script tag before your closing `</body>` tag, you can access the library via the global canvasGridLines variable:
```html
<script>
  document.addEventListener('DOMContentLoaded', () => {
    // The library is available globally
    canvasGridLines.initGrid({
        targets: '[data-grid]',
        columns: 12
    });
  });
</script>
```

### ES Modules / TypeScript

```javascript
import { canvasGridLines, Units } from 'canvas-grid-lines';
import 'canvas-grid-lines/css';

document.addEventListener('DOMContentLoaded', () => {
    canvasGridLines.initGrid({
        targets: '[data-grid]',
        columns: 12
    });
});
```

### CommonJS (For Node.js or older build systems)

```javascript
const { canvasGridLines, Units } = require('canvas-grid-lines');

canvasGridLines.initGrid({
    targets: '[data-grid]',
    columns: 29
});
```
CSS my be included either as an import in CSS/SCSS
````
@import "node_modules/canvas-grid-lines/dist/canvas-grid-lines.css";
````
or in the HTML as `<link>` tag
```
<link rel="stylesheet" href="node_modules/canvas-grid-lines/dist/canvas-grid-lines.css">
```

### Prepare the HTML
```html
<div class="my-container"
     data-grid-type="squared"
     data-grid-color="rgba(0, 0, 255, 0.5)">
```
and for CommonJS
```html
<link rel="stylesheet" href="canvas-grid-lines.css">
```


### Updating the columnCount
You may change the column count of the grid any time.
```javascript
canvasGridLines.setColumns(29);
```


## Configuration
### HTML elements to be used
Any `querySelectorAll`-compatible selector may be given. In the example code above the data attribute needed for the grid type is used.

### Grid Type
The grid type is read from a mandatory data attribute `data-grid-type` and may be of the following values: `baseline`, `squared`, `columns`, `rows`

### Line width
Line width as integer or float.

### Units (optional, default: layoutPixel)
The units parameter tells the script how to interpret the line width: either layout size (`layoutpixel` as in CSS) or physical pixels (`devicepixel`).

### Extend (optional, default: false)
Lines are always drawn onto the center of the grid calculated with zero line width. The sides of thicker lines thus protrude the html element. This parameter controls whether the ends of lines will also be extended. 

### Color (optional, default: black)
A [CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value) setting the lines’ color.


## License

 - **ISC** : http://opensource.org/licenses/ISC