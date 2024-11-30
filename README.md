# canvas-grid-lines

![npm](https://img.shields.io/npm/v/canvas-grid-lines.svg) ![license](https://img.shields.io/npm/l/canvas-grid-lines.svg) ![github-issues](https://img.shields.io/github/issues/profitlich-ch/canvas-grid-lines.svg)  !

Draws grid lines as HTML canvas element (baseline, squared and more) 

![stars](https://img.shields.io/github/stars/profitlich-ch/canvas-grid-lines.svg)
![forks](https://img.shields.io/github/forks/profitlich-ch/canvas-grid-lines.svg)


## Features
This script draws grid lines behind a given html element. It therefore creates a html `<canvas>` element. The grid is automatically adapted to the screen’s resolution (retina etc.) and redrawn any time the window is resized.

Multiple grids are available:

- baseline (horizontal lines)
- squared (horizontal and vertical lines)
- columns (vertical lines showing columns with gaps)
- rows (vertical lines for columns without gaps and horizontal lines)

The grid lines are set precisely onto the physical pixels of the screen thus they are always crips. This distinguishes them from lines shown by SVG background images or drawn with CSS gradients.

## Install

`npm install --save canvas-grid-lines`


## Scripts

 <!-- - **npm run test** : `echo "Error: no test specified" && exit 1` -->

## Dependencies

no dependencies


## Contributing

Contributions welcome; Please submit all pull requests the against main branch. If your pull request contains JavaScript patches or features, you should include relevant unit tests. Looking forwards to your ideas!

## Author

Moritz Profitlich

## License

 - **ISC** : http://opensource.org/licenses/ISC
