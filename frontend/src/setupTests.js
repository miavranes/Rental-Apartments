// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import './i18n';

jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

jest.mock('react-leaflet', () => {
  const React = require('react');
  const passthrough = ({ children }) => React.createElement('div', null, children);

  return {
    MapContainer: passthrough,
    TileLayer: () => React.createElement('div', null),
    Marker: passthrough,
    Popup: passthrough,
    useMapEvents: () => ({ flyTo: jest.fn() }),
  };
});
