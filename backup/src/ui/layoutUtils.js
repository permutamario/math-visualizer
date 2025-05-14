// src/ui/layoutUtils.js

/**
 * Create a control from a parameter definition
 * @param {UIBuilder} builder - UI builder instance
 * @param {Object} param - Parameter definition
 * @param {any} value - Current value
 * @param {Function} onChange - Change handler
 * @returns {HTMLElement} The created control
 */
export function createControl(builder, param, value, onChange) {
  const control = builder.createControl(param, value, onChange);
  
  // Ensure labels have correct color
  const labels = control.querySelectorAll('label');
  labels.forEach(label => {
    label.style.color = 'var(--text-color)';
  });
  
  // Ensure any buttons use accent color
  const buttons = control.querySelectorAll('button');
  buttons.forEach(button => {
    button.style.backgroundColor = 'var(--accent-color)';
    button.style.color = 'white';
  });
  
  return control;
}

/**
 * Update a control element with a new value
 * @param {HTMLElement} element - Control element
 * @param {any} value - New value
 */
export function updateControlValue(element, value) {
  if (!element) return;
  
  switch (element.type) {
    case 'range':
    case 'number':
    case 'text':
      element.value = value;
      
      // Update value display for sliders
      if (element.type === 'range') {
        const valueDisplay = element.parentElement?.querySelector('.value-display');
        if (valueDisplay) valueDisplay.textContent = value;
      }
      break;
      
    case 'checkbox':
      element.checked = value;
      break;
      
    case 'color':
    case 'select-one':
      element.value = value;
      break;
  }
}

/**
 * Create a button with consistent styling
 * @param {string} id - Button ID
 * @param {string} label - Button text
 * @param {Function} onClick - Click handler
 * @param {boolean} accent - Whether to use accent color
 * @returns {HTMLElement} Button element
 */
export function createButton(id, label, onClick, accent = true) {
  const button = document.createElement('button');
  button.id = id;
  button.textContent = label;
  button.style.backgroundColor = accent ? 'var(--accent-color)' : 'var(--control-bg)';
  button.style.color = accent ? 'white' : 'var(--text-color)';
  button.style.padding = '10px';
  button.style.borderRadius = '4px';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.width = '100%';
  button.style.marginBottom = '10px';
  button.style.transition = 'background-color 0.2s, transform 0.1s';
  
  // Active state
  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(1px)';
    button.style.backgroundColor = 'var(--control-focus)';
  });
  
  // Reset state
  button.addEventListener('mouseup', () => {
    button.style.transform = 'none';
    button.style.backgroundColor = accent ? 'var(--accent-color)' : 'var(--control-bg)';
  });
  
  button.addEventListener('click', onClick);
  
  return button;
}

/**
 * Create a placeholder message element
 * @param {string} message - Message text
 * @returns {HTMLElement} Placeholder element
 */
export function createPlaceholder(message) {
  const placeholder = document.createElement('p');
  placeholder.textContent = message;
  placeholder.style.fontStyle = 'italic';
  placeholder.style.color = 'var(--text-secondary)';
  placeholder.style.textAlign = 'center';
  placeholder.style.padding = '8px';
  return placeholder;
}

/**
 * Create a panel with a title
 * @param {string} id - Panel ID
 * @param {string} title - Panel title
 * @param {string} className - Panel CSS class
 * @returns {HTMLElement} Panel element
 */
export function createPanel(id, title, className = 'control-panel') {
  const panel = document.createElement('div');
  panel.id = id;
  panel.className = className;
  
  const headerEl = document.createElement('h3');
  headerEl.textContent = title;
  headerEl.style.color = 'var(--text-color)';
  panel.appendChild(headerEl);
  
  const placeholder = createPlaceholder('No parameters available.');
  panel.appendChild(placeholder);
  
  return panel;
}

/**
 * Create a theme toggle button
 * @param {Object} core - App core reference
 * @param {boolean} isMobile - Whether to create mobile button
 * @returns {HTMLElement} Theme toggle button
 */
export function createThemeToggleButton(core, isMobile = false) {
  // Check if core has a color scheme manager
  if (!core || !core.colorSchemeManager) return null;
  
  const currentScheme = core.colorSchemeManager.getActiveScheme();
  const className = isMobile ? 'mobile-theme-toggle' : 'theme-toggle';
  
  const button = document.createElement('button');
  button.className = className;
  button.setAttribute('aria-label', 'Toggle color scheme');
  button.textContent = currentScheme.id === 'light' ? '🌙' : '☀️';
  
  button.addEventListener('click', () => {
    const scheme = core.colorSchemeManager.getActiveScheme();
    const newScheme = scheme.id === 'light' ? 'dark' : 'light';
    core.colorSchemeManager.setActiveScheme(newScheme);
  });
  
  return button;
}

/**
 * Create a fullscreen toggle button
 * @param {boolean} isMobile - Whether to create mobile button
 * @param {Function} onToggle - Toggle callback
 * @returns {HTMLElement} Fullscreen toggle button
 */
export function createFullscreenButton(isMobile = false, onToggle = null) {
  const id = isMobile ? 'mobile-fullscreen-button' : 'desktop-fullscreen-button';
  const className = isMobile ? 'mobile-fullscreen-button' : 'fullscreen-button';
  
  // Remove existing button if any
  const existingButton = document.getElementById(id);
  if (existingButton && existingButton.parentNode) {
    existingButton.parentNode.removeChild(existingButton);
  }
  
  const button = document.createElement('button');
  button.id = id;
  button.className = className;
  button.innerHTML = '<span class="fullscreen-icon">⛶</span>';
  button.title = 'Toggle Fullscreen Mode';
  
  if (isMobile) {
    button.style.color = 'var(--text-color)';
  }
  
  button.addEventListener('click', () => {
    document.body.classList.toggle('fullscreen-mode');
    
    if (document.body.classList.contains('fullscreen-mode')) {
      button.innerHTML = '<span class="fullscreen-icon">⤢</span>';
      button.title = 'Exit Fullscreen Mode';
      if (isMobile) button.classList.add('fullscreen-active');
    } else {
      button.innerHTML = '<span class="fullscreen-icon">⛶</span>';
      button.title = 'Enter Fullscreen Mode';
      if (isMobile) button.classList.remove('fullscreen-active');
    }
    
    // Call toggle callback if provided
    if (onToggle && typeof onToggle === 'function') {
      onToggle(document.body.classList.contains('fullscreen-mode'));
    }
  });
  
  return button;
}

/**
 * Create a plugin list item
 * @param {Object} plugin - Plugin metadata
 * @param {string} activePluginId - Currently active plugin ID
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Plugin list item
 */
export function createPluginListItem(plugin, activePluginId, onClick) {
  const item = document.createElement('div');
  item.className = 'plugin-list-item';
  if (plugin.id === activePluginId) {
    item.classList.add('active');
  }
  
  const title = document.createElement('h4');
  title.className = 'plugin-list-item-title';
  title.textContent = plugin.name;
  title.style.color = 'var(--text-color)';
  
  const description = document.createElement('p');
  description.className = 'plugin-list-item-description';
  description.textContent = plugin.description;
  description.style.color = 'var(--text-secondary)';
  
  item.appendChild(title);
  item.appendChild(description);
  
  item.addEventListener('click', () => onClick(plugin.id));
  
  return item;
}