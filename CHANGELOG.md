# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Releases up to and including 10.2.1 predate this file; for those, see the
[commit history](https://github.com/profitlich-ch/canvas-grid-lines/commits/main)
and the [tags](https://github.com/profitlich-ch/canvas-grid-lines/tags).

## [Unreleased]

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

[Unreleased]: https://github.com/profitlich-ch/canvas-grid-lines/compare/v10.2.1...HEAD
