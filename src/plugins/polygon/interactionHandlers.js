// src/plugins/polygon/interactionHandlers.js
import { isPointInPolygon } from './requiredFunctions.js';

// Access to shared state (imported from requiredFunctions would create a new instance)
let interactiveState;

// Initialize interactive state
function getInteractiveState() {
  if (!interactiveState) {
    interactiveState = {
      isHovered: false,
      isSelected: false,
      animationAngle: 0
    };
  }
  return interactiveState;
}

/**
 * Handle mouse move for hover effects
 * @param {Object} event - Mouse event data
 * @returns {boolean} Whether the event was handled
 */
export function handleMouseMove(event) {
  const state = getInteractiveState();
  const { x, y } = event;
  const canvas = event.canvas;
  
  // Get current settings
  const settings = window.getState ? window.getState().settings : {};
  
  // Check if mouse is over the polygon
  const wasHovered = state.isHovered;
  state.isHovered = isPointInPolygon(x, y, canvas, settings);
  
  // Only update state and re-render if hover state changed
  if (wasHovered !== state.isHovered) {
    // Request render update
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  }
  
  return true; // Event was handled
}

/**
 * Handle click for selection
 * @param {Object} event - Click event data
 * @returns {boolean} Whether the event was handled
 */
export function handleClick(event) {
  const state = getInteractiveState();
  const { x, y } = event;
  const canvas = event.canvas;
  
  // Get current settings
  const settings = window.getState ? window.getState().settings : {};
  
  // Check if click is on the polygon
  if (isPointInPolygon(x, y, canvas, settings)) {
    state.isSelected = !state.isSelected;
    
    // Request render update
    if (window.AppInstance && window.AppInstance.canvasManager) {
      window.AppInstance.canvasManager.render();
    }
  } else {
    // If clicked outside and polygon was selected, unselect it
    if (state.isSelected) {
      state.isSelected = false;
      
      // Request render update
      if (window.AppInstance && window.AppInstance.canvasManager) {
        window.AppInstance.canvasManager.render();
      }
    }
  }
  
  return true; // Event was handled
}
