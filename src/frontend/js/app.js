// Main application entry point
const container = document.getElementById('app');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));

// Add a window resize listener to toggle between layouts
window.addEventListener('resize', () => {
  root.render(React.createElement(App));
});
