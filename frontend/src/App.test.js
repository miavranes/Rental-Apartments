import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Rentura home page', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /rentura/i })).toBeInTheDocument();
  expect(screen.getByText(/find your next stay/i)).toBeInTheDocument();
});
