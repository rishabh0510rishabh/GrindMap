# Accessibility Improvements TODO

## Global Focus Styles
- [x] Add visible focus indicators to App.css for all interactive elements

## ThemeToggle Component
- [x] Add ARIA labels and roles to theme buttons
- [x] Add keyboard navigation for theme selection
- [x] Add ARIA for color inputs

## UsernameInputs Component
- [ ] Add ARIA attributes to dropdown (role="listbox", aria-expanded, etc.)
- [ ] Improve keyboard navigation for history dropdown

## PlatformCard Component
- [x] Add role="button" and tabIndex="0" to card divs
- [x] Add keyboard event handler for Enter/Space to toggle expansion
- [x] Add ARIA labels for card content

## Other Components
- [ ] Review and update Dashboard, GoalCard, etc. for accessibility
- [ ] Ensure all buttons have aria-labels where needed

## Testing
- [ ] Test keyboard navigation through the app
- [ ] Test with screen reader
