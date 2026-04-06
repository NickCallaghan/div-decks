# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.3.0] - 2026-04-06

### Added

- Export PDF button — export presentations via the browser's print dialog (Cmd+P)
- Git status integration in the editor toolbar (branch, file status)
- E2E test suite with Playwright
- CSS linting with stylelint
- Generic brand compatibility for custom-styled slide decks

### Fixed

- Presentation mode close button and escape handling
- Gradient text (`background-clip: text`) rendering correctly in PDF export

## [0.2.0] - 2026-04-02

### Added

- Atomic container support — cards, KPIs, and panels drag as units
- Generic grid child detection for atomic containers
- Expanded bridge editability to cover all visual-explainer elements
- Custom HMR for presentation file changes

### Fixed

- Handle walk-up for wrapper elements
- Drag targets for atomic containers
- Presentation mode in complex slide decks
- Simplified reorderable selector to semantic elements approach

## [0.1.2] - 2026-04-02

### Fixed

- README corrections: credit visual-explainer author, clarify deck format

## [0.1.1] - 2026-04-02

### Added

- Proper README with usage documentation

## [0.1.0] - 2026-04-02

### Added

- Initial release
- File browser for HTML slide decks in `presentations/` directory
- Visual slide editor with iframe-based rendering for style isolation
- Click-to-select, click-to-edit text elements
- Notion-style drag handles with drag-to-reorder (swap for grids, insert for lists)
- Context menu (move up/down, duplicate, delete)
- Undo/redo with 50-snapshot history
- Presentation mode — full-screen slideshow using original SlideEngine
- Keyboard shortcuts (Cmd+S save, Cmd+Z undo, arrows navigate)
- Express backend for reading/writing HTML files
- CLI entry point (`npx div-deck`)
