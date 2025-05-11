// src/ui/SelectionWindow.js

/**
 * Centralized plugin selection window
 * Shows available plugins in a modal-like interface
 */
export class SelectionWindow {
  /**
   * Create a new SelectionWindow
   * @param {Object[]} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   * @param {Function} onSelect - Callback function when a plugin is selected
   * @param {Function} onClose - Callback function when the window is closed
   */
  constructor(plugins, activePluginId, onSelect, onClose) {
    this.plugins = plugins || [];
    this.activePluginId = activePluginId;
    this.onSelect = onSelect;
    this.onClose = onClose;
    this.element = null;
    this.visible = false;
    
    // Bind methods
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }
  
  /**
   * Create the selection window DOM elements
   * @returns {HTMLElement} The selection window element
   */
  create() {
    // Check if the element already exists
    if (this.element) {
      return this.element;
    }
    
    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'selection-window-overlay hidden';
    
    // Create window content
    const windowContent = document.createElement('div');
    windowContent.className = 'selection-window-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'selection-window-header';
    
    const title = document.createElement('h2');
    title.className = 'selection-window-title';
    title.textContent = 'Select Visualization';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'selection-window-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.addEventListener('click', this.hide);
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Create plugin grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'selection-window-grid';
    
    // Create plugin cards
    this.plugins.forEach(plugin => {
      const card = this.createPluginCard(plugin);
      gridContainer.appendChild(card);
    });
    
    // Assemble the window
    windowContent.appendChild(header);
    windowContent.appendChild(gridContainer);
    this.element.appendChild(windowContent);
    
    // Add to document body
    document.body.appendChild(this.element);
    
    // Initialize as hidden
    this.visible = false;
    
    return this.element;
  }
  
  /**
   * Create a plugin card
   * @param {Object} plugin - Plugin metadata
   * @returns {HTMLElement} Plugin card element
   */
  createPluginCard(plugin) {
    const card = document.createElement('div');
    card.className = 'selection-window-card';
    if (plugin.id === this.activePluginId) {
      card.classList.add('active');
    }
    
    // Create card content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'selection-window-card-content';
    
    // Create plugin title
    const title = document.createElement('h3');
    title.className = 'selection-window-card-title';
    title.textContent = plugin.name;
    
    // Create plugin description
    const description = document.createElement('p');
    description.className = 'selection-window-card-description';
    description.textContent = plugin.description;
    
    // Create image placeholder (for future GIFs)
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.className = 'selection-window-card-image';
    
    // Create a simple icon based on rendering type
    const icon = document.createElement('div');
    icon.className = 'selection-window-card-icon';
    
    // Set icon content based on rendering type
    if (plugin.renderingType === '3d') {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M12 1L1 5v14l11 4 11-4V5L12 1zM5 7.2l6-2.2 6 2.2v7.1l-6 2.2-6-2.2V7.2z"/></svg>';
    } else {
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M4 4h16v16H4V4z M12 17.5L4.5 10l3-3L12 11.5l4.5-4.5 3 3L12 17.5z"/></svg>';
    }
    
    imagePlaceholder.appendChild(icon);
    
    // Add event listener for selection
    card.addEventListener('click', () => {
      if (typeof this.onSelect === 'function') {
        this.onSelect(plugin.id);
      }
      this.hide();
    });
    
    // Assemble the card
    contentContainer.appendChild(title);
    contentContainer.appendChild(description);
    card.appendChild(imagePlaceholder);
    card.appendChild(contentContainer);
    
    return card;
  }
  
  
   * Show the selection window
   */
  show() {
    // Create the element if it doesn't exist
    if (!this.element) {
      this.create();
    }
    
    // Make sure the element exists and is not already visible
    if (this.element && !this.visible) {
      this.element.classList.remove('hidden');
      
      // Mark as visible immediately to prevent race conditions
      this.visible = true;
      
      // Prevent body scrolling while modal is open
      document.body.style.overflow = 'hidden';
      
      // Add animation class after a short delay
      setTimeout(() => {
        if (this.element) {
          this.element.classList.add('visible');
          
          // Add event listeners after a short delay to prevent immediate closing
          setTimeout(() => {
            // Add global event listeners
            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('click', this.handleOutsideClick);
          }, 100);
        }
      }, 10); // Short delay for the CSS transition to work
    }
    
    // Update active plugin highlight
    this.updateActivePlugin(this.activePluginId);
  }
  
  /**
   * Hide the selection window
   */
  hide() {
    if (this.element && this.visible) {
      // Start fade-out animation
      this.element.classList.remove('visible');
      
      // Remove event listeners
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('click', this.handleOutsideClick);
      
      // Hide after animation completes
      setTimeout(() => {
        if (this.element) {
          this.element.classList.add('hidden');
          this.visible = false;
          
          // Restore body scrolling
          document.body.style.overflow = '';
          
          // Call onClose callback if provided
          if (typeof this.onClose === 'function') {
            this.onClose();
          }
        }
      }, 300); // Match the CSS transition duration
    }
  }
  
  /**
   * Update the active plugin highlight
   * @param {string} activePluginId - ID of the active plugin
   */
  updateActivePlugin(activePluginId) {
    this.activePluginId = activePluginId;
    
    // Update card highlights
    if (this.element) {
      const cards = this.element.querySelectorAll('.selection-window-card');
      cards.forEach(card => {
        const index = Array.from(cards).indexOf(card);
        if (this.plugins[index] && this.plugins[index].id === activePluginId) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });
    }
  }
  
  /**
   * Update the list of available plugins
   * @param {Object[]} plugins - Available plugin metadata
   * @param {string} activePluginId - Currently active plugin ID
   */
  update(plugins, activePluginId) {
    this.plugins = plugins || [];
    this.activePluginId = activePluginId;
    
    // If the element exists, rebuild it
    if (this.element && this.element.parentNode) {
      // Remember visibility state
      const wasVisible = this.visible;
      
      // Remove old element
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      
      // Create new element
      this.create();
      
      // Restore visibility if needed
      if (wasVisible) {
        this.show();
      }
    }
  }
  
  /**
   * Handle keydown events (close on Escape)
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.hide();
    }
  }
  
   /**
   * Handle clicks outside the window content
   * @param {MouseEvent} event - Mouse event
   */
  handleOutsideClick(event) {
    // Make sure we're not handling the same click that opened the window
    // by checking if the click target is the button that opens the window
    if (event.target.closest('.plugin-selector-button') || 
        event.target.closest('#mobile-plugin-button')) {
      return;
    }
    
    if (this.element && this.visible) {
      const windowContent = this.element.querySelector('.selection-window-content');
      if (windowContent && !windowContent.contains(event.target)) {
        this.hide();
      }
    }
  }
  
  /**
   * Clean up resources when no longer needed
   */
  dispose() {
    // Hide the window
    this.hide();
    
    // Remove the element from DOM
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clear references
    this.element = null;
    this.plugins = [];
    this.onSelect = null;
    this.onClose = null;
  }
}