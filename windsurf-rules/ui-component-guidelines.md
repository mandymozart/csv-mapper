# UI Component Guidelines

## WebAwesome Integration

### Required Imports
```javascript
// Always import the default theme
import '@awesome.me/webawesome/dist/styles/themes/default.css';

// Import only the components you need
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
```

### Button Components
```html
<!-- Primary actions -->
<wa-button variant="primary" onclick={handleAction}>
  <wa-icon name="icon-name"></wa-icon>
  Button Text
</wa-button>

<!-- Secondary actions -->
<wa-button variant="default" onclick={handleAction}>
  Action Text
</wa-button>

<!-- Success actions (downloads, saves) -->
<wa-button variant="success" onclick={handleAction}>
  <wa-icon name="download"></wa-icon>
  Download
</wa-button>
```

### Icon Usage
- Use semantic icon names from WebAwesome icon library
- Common icons:
  - `folder-open` - Load/Open actions
  - `download` - Export/Download actions  
  - `upload` - Import/Upload actions
  - `file-arrow-down` - File download
  - `save` - Save actions
  - `trash` - Delete actions

### Form Controls
```html
<!-- Text inputs -->
<wa-input 
  type="text" 
  placeholder="Enter value"
  bind:value={inputValue}
></wa-input>

<!-- File inputs (keep hidden, trigger programmatically) -->
<input 
  type="file" 
  accept=".json,.csv"
  bind:this={fileInput}
  style="display: none;"
  onchange={handleFileSelect}
>
```

## Component Patterns

### Reusable Components
- Create components in `src/lib/components/`
- Use TypeScript interfaces for props
- Export component props interface

### State Management
```javascript
// Use Svelte 5 state runes
let componentState = $state(initialValue);
let derivedState = $derived(computedValue);
```

### Event Handling
```javascript
// Use descriptive event handler names
function handleFileImport(event) { ... }
function handleProfileSave() { ... }
function handleDataTransform() { ... }
```

## Accessibility Standards

### WebAwesome Accessibility
- WebAwesome components include built-in accessibility features
- No need to add additional ARIA roles to WebAwesome components
- Focus management is handled internally

### Custom Components
- Use semantic HTML elements
- Provide meaningful labels
- Ensure keyboard navigation works
- Test with screen readers

## Styling Guidelines

### CSS Organization
```css
/* Component-specific styles in <style> blocks */
.component-container {
  /* Layout styles */
}

.component-element {
  /* Element-specific styles */
}

/* Use CSS custom properties for theming */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### Responsive Design
- Use CSS Grid and Flexbox for layouts
- Implement mobile-first responsive design
- Test on multiple screen sizes

## Performance Guidelines

### Component Loading
- Import WebAwesome components only where needed
- Use dynamic imports for large components
- Implement lazy loading for heavy components

### State Updates
- Minimize reactive updates
- Use derived state for computed values
- Batch state updates when possible
