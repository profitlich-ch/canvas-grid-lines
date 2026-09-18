# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases up to and including 10.2.1 predate this file; for those, see the
[commit history](https://github.com/profitlich-ch/canvas-grid-lines/commits/main)
and the [tags](https://github.com/profitlich-ch/canvas-grid-lines/tags).

## [Unreleased]

### Fixed

- Lines are placed half a line width off the rounded grid position, as the
  canvas margins intended. The half width was rounded away, so the top line
  was cut in half and every other odd-width line (e.g. 1px) was smeared
  across two half-opaque pixels. Vertical lines of `squared` and `rows` now
  end at the lower edge of the last horizontal line instead of its centre.

## [10.4.0] — 2026-09-17

### Added

- `refresh()` — re-measures the container and redraws the grid. Until now a
  container that changed size without the window resizing kept a canvas of
  the old size; the only way to redraw was reassigning a setter such as
  `grid.columns = grid.columns`, relying on its side effect.
- `observeResize` option (`data-grid-observe-resize`) — redraws whenever the
  container itself changes size, not only on window resize. Off by default,
  because every redraw reallocates the canvas bitmap. All grids share one
  `ResizeObserver`; redraws are batched to at most one per grid per frame and
  skipped when the container's pixel size is unchanged. With
  `termination: 'extend'` the pinned `min-height` lets the container follow
  growth but not shrinking; call `refresh()` for that.

## [10.3.0] — 2026-09-04

### Added

- `gridType: 'ribbons'` — filled column bands instead of stroked column edges.
  Takes the same three values as `columns`, read as `total, band, gap`: the
  space between each pair of edges from the alternating gap sequence is filled.
  Use it to show the columns themselves rather than their boundaries.
  `lineWidth` and `termination` have no effect on it, and a band the sequence
  leaves open (an odd number of edges) is dropped.

### Fixed

- `termination: 'extend'` no longer grows the container of grid types that draw
  no horizontal line. The guard was hardcoded to exempt `'columns'` instead of
  asking what the option actually depends on — whether there is a horizontal
  line to close the bottom edge with. It now reads `hasHorizontalEdgeLine`, so
  every such grid type is exempt. No change in behaviour for the grid types that
  existed before.

[Unreleased]: https://github.com/profitlich-ch/canvas-grid-lines/compare/v10.4.0...HEAD
[10.4.0]: https://github.com/profitlich-ch/canvas-grid-lines/compare/v10.3.0...v10.4.0
[10.3.0]: https://github.com/profitlich-ch/canvas-grid-lines/compare/v10.2.1...v10.3.0
