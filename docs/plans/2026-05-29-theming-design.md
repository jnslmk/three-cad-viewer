# Custom Theme API Design

## Overview

Allow users to create custom themes via `viewer.setTheme({ preset, overrides })`. Built-in presets provide a base; CSS variable overrides give full control including transparent backgrounds. Both DOM and 3D scene colors sync automatically.

## API

```typescript
// Basic usage
viewer.setTheme({ preset: 'light' | 'dark' | 'catppuccin-mocha' | 'catppuccin-mocha-transparent' });

// With overrides
viewer.setTheme({
  preset: 'dark',
  overrides: {
    '--tcv-bg-color': 'rgba(30, 30, 46, 0.8)',
    '--tcv-font-color': '#cdd6f4'
  }
});
```

## Presets

### catppuccin-mocha-transparent

A new preset based on Catppuccin Mocha with semi-transparent background:

```javascript
{
  '--tcv-theme-blue': 'rgb(137, 180, 250)',
  '--tcv-theme-led': 'rgb(249, 226, 175)',
  '--tcv-font-color': '#cdd6f4',
  '--tcv-bg-color': 'rgba(30, 30, 46, 0.8)',
  '--tcv-bg-overlay-color': 'rgba(49, 50, 68, 0.9)',
  '--tcv-bg-overlay-rest-color': 'rgba(49, 50, 68, 0.14)',
  '--tcv-bg-highlight-color': 'rgb(69, 71, 90)',
  '--tcv-bg-pressed-color': 'rgb(88, 91, 112)',
  '--tcv-bg-pressed-border-color': '#6c7086',
  '--tcv-bg-tooltip-color': 'rgb(49, 50, 68)',
  '--tcv-x-color': 'rgb(243, 139, 168)',
  '--tcv-y-color': 'rgb(166, 227, 161)',
  '--tcv-z-color': 'rgb(137, 180, 250)',
  '--tcv-shadow': 'rgba(17, 17, 27, 0.6)',
  '--tcv-menu-shadow': 'rgba(24, 24, 37, 0.6)',
  '--tcv-scrollbar-hover': 'rgba(245, 224, 220, 0.4)',
  '--tcv-scrollbar-active': 'rgba(245, 224, 220, 0.6)',
  '--tcv-scrollbar-thumb': 'rgba(245, 224, 220, 0.2)',
  '--tcv-dropdown-bg': '#181825'
}
```

## Theme Resolution Flow

1. `setTheme({ preset, overrides })` is called
2. If `preset` exists in built-in presets, use it; if not, error
3. Merge `overrides` into preset vars
4. Apply merged vars to container via `element.style.setProperty(var, value)`
5. For 3D components: read computed CSS values, parse to RGB arrays
6. Inject into each component's `colors[themeName]` map
7. Set `component.theme = themeName`, call `changeTheme(themeName)`

## Color Sync for 3D Components

Components affected: axes, grid, clipping, orientation.

Each stores:
```typescript
this.colors = {
  dark: [[r,g,b], [r,g,b], [r,g,b]],
  light: [[r,g,b], [r,g,b], [r,g,b]],
  custom: [[r,g,b], [r,g,b], [r,g,b]]  // injected dynamically
};
```

When custom theme set:
1. Read `--tcv-x-color`, `--tcv-y-color`, `--tcv-z-color` from computed styles
2. Parse hex/rgb/rgba string to `[r, g, b]` arrays (0-1 range for Three.js)
3. `component.colors['custom-theme-id'] = parsedColors`
4. `component.theme = 'custom-theme-id'`
5. `component.changeTheme('custom-theme-id')`

## No Persistence

Theme is set once at init. No localStorage or runtime persistence. User controls save/load if needed.

## Files to Modify

- `src/ui/display.ts` — add `setTheme()` logic for preset+override merging
- `src/core/viewer.ts` — expose `setTheme()` method
- `src/core/types.ts` — add preset type enum
- `src/scene/axes.ts` — add `changeColors()` / support dynamic color injection
- `src/scene/grid.ts` — same
- `src/scene/clipping.ts` — same
- `src/scene/orientation.ts` — same
- `css/global.css` — add catppuccin-mocha-transparent preset