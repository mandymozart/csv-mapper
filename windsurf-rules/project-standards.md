# CSV Mapper Project Standards

## Architecture & Structure

### Component Organization
- **Reusable Components**: Create shared components in `src/lib/components/` for common UI elements
- **Component Naming**: Use PascalCase for component files (e.g., `CsvImportDialog.svelte`)
- **Component Props**: Use TypeScript interfaces for component props to ensure type safety

### State Management
- Use Svelte 5's `$state()` runes for reactive state
- Keep state as close to where it's used as possible
- Use stores only for truly global state

### File Structure
```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── utils/          # Utility functions
│   └── types.ts        # TypeScript type definitions
├── routes/             # SvelteKit routes
└── functions/          # Business logic functions
```

## UI/UX Standards

### WebAwesome Components
- Use WebAwesome components for consistent UI: `wa-button`, `wa-input`, `wa-icon`, etc.
- Import only needed components to reduce bundle size
- Always import the default theme: `@awesome.me/webawesome/dist/styles/themes/default.css`

### Styling Guidelines
- Use semantic CSS class names
- Prefer CSS custom properties for theming
- Keep component-specific styles in the component's `<style>` block
- Remove unused CSS selectors to avoid lint warnings

### Accessibility
- WebAwesome components handle accessibility internally
- Use semantic HTML elements where appropriate
- Provide meaningful labels and descriptions

## Data Management

### CSV Processing
- Use Papa Parse for CSV parsing and generation
- Handle large files with streaming when possible
- Validate CSV structure before processing

### Profile Management
- Store profiles in localStorage for persistence
- Use JSON format for project import/export
- Always validate imported data structure

### File Operations
- Prompt users for filenames on export operations
- Ensure `.json` extension for project files
- Handle file selection cancellation gracefully

## Code Quality

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` types - use proper typing

### Error Handling
- Provide user-friendly error messages
- Log errors for debugging
- Handle edge cases gracefully

### Performance
- Use pagination for large datasets
- Implement lazy loading where appropriate
- Minimize re-renders with proper reactive patterns

## Development Workflow

### Testing
- Test all user interactions
- Validate data transformations
- Test file import/export functionality

### Documentation
- Document complex business logic
- Provide clear component prop documentation
- Keep README updated with setup instructions

## Project Export/Import Standards

### Export Format
```json
{
  "name": "CSV Mapper Project",
  "version": "1.0.0",
  "exportedAt": "ISO-8601-timestamp",
  "profiles": [...]
}
```

### Import Validation
- Validate JSON structure
- Check for required fields
- Provide meaningful error messages for invalid files

## Transformation Functions

### Function Structure
- Keep transformation functions pure
- Handle optional parameters with defaults
- Use descriptive parameter names

### Mapping Logic
- Support optional target column names (default to source column)
- Support optional transformations (default to pass-through)
- Validate transformation syntax before execution
