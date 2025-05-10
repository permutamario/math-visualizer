// src/ui/UIBuilder.js

/**
 * Builds UI controls from parameter definitions
 */
export class UIBuilder {
  /**
   * Create a new UIBuilder
   */
  constructor() {
    // Control creation functions mapped by type
    this.controlBuilders = {
      'slider': this.createSlider.bind(this),
      'checkbox': this.createCheckbox.bind(this),
      'color': this.createColorPicker.bind(this),
      'dropdown': this.createDropdown.bind(this),
      'number': this.createNumberInput.bind(this),
      'text': this.createTextInput.bind(this)
    };
  }
  
  /**
   * Create a control from a parameter definition
   * @param {ParameterDefinition} param - Parameter definition
   * @param {any} value - Current value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Created control
   */
  createControl(param, value, onChange) {
    // Get the builder function for this control type
    const builder = this.controlBuilders[param.type];
    
    if (!builder) {
      console.error(`Unknown control type: ${param.type}`);
      return this.createUnsupportedControl(param);
    }
    
    // Create the control
    return builder(param, value, onChange);
  }
  
  /**
   * Create a container for a control
   * @returns {HTMLElement} Control container
   */
  createControlContainer() {
    const container = document.createElement('div');
    container.className = 'control';
    return container;
  }
  
  /**
   * Create a label element
   * @param {string} id - Input ID
   * @param {string} text - Label text
   * @returns {HTMLElement} Label element
   */
  createLabel(id, text) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = text;
    return label;
  }
  
  /**
   * Create a slider control
   * @param {ParameterDefinition} param - Parameter definition
   * @param {number} value - Current value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Slider control element
   */
  createSlider(param, value, onChange) {
    const container = this.createControlContainer();
    const label = this.createLabel(param.id, param.label);
    
    const input = document.createElement('input');
    input.type = 'range';
    input.id = param.id;
    input.min = param.min !== undefined ? param.min : 0;
    input.max = param.max !== undefined ? param.max : 100;
    input.step = param.step !== undefined ? param.step : 1;
    input.value = value !== undefined ? value : param.default;
    
    // Value display
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'value-display';
    valueDisplay.textContent = value !== undefined ? value : param.default;
    
    // Input container (for layout)
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';
    inputContainer.appendChild(input);
    inputContainer.appendChild(valueDisplay);
    
    // Handle change events
    input.addEventListener('input', (e) => {
      const newValue = parseFloat(e.target.value);
      valueDisplay.textContent = newValue;
      onChange(newValue);
    });
    
    container.appendChild(label);
    container.appendChild(inputContainer);
    
    return container;
  }
  
  /**
   * Create a checkbox control
   * @param {ParameterDefinition} param - Parameter definition
   * @param {boolean} value - Current value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Checkbox control element
   */
  createCheckbox(param, value, onChange) {
    const container = document.createElement('div');
    container.className = 'control checkbox-container';
    
    const label = document.createElement('label');
    label.htmlFor = param.id;
    label.textContent = param.label;
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = param.id;
    input.checked = value !== undefined ? value : param.default;
    
    input.addEventListener('change', (e) => {
      onChange(e.target.checked);
    });
    
    container.appendChild(label);
    container.appendChild(input);
    
    return container;
  }
  
  /**
   * Create a color picker control
   * @param {ParameterDefinition} param - Parameter definition
   * @param {string} value - Current color value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Color picker control element
   */
  createColorPicker(param, value, onChange) {
    const container = this.createControlContainer();
    const label = this.createLabel(param.id, param.label);
    
    const input = document.createElement('input');
    input.type = 'color';
    input.id = param.id;
    input.value = value !== undefined ? value : param.default;
    
    input.addEventListener('input', (e) => {
      onChange(e.target.value);
    });
    
    container.appendChild(label);
    container.appendChild(input);
    
    return container;
  }
  
  /**
   * Create a dropdown control
   * @param {ParameterDefinition} param - Parameter definition
   * @param {string} value - Current value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Dropdown control element
   */
  createDropdown(param, value, onChange) {
    const container = this.createControlContainer();
    const label = this.createLabel(param.id, param.label);
    
    const select = document.createElement('select');
    select.id = param.id;
    
    // Add options
    if (param.options && Array.isArray(param.options)) {
      param.options.forEach(option => {
        const optionEl = document.createElement('option');
        
        // Handle option objects with value/label
        if (typeof option === 'object' && option !== null) {
          optionEl.value = option.value;
          optionEl.textContent = option.label || option.value;
        } else {
          // Simple string option
          optionEl.value = option;
          optionEl.textContent = option;
        }
        
        // Set selected if matches current value
        if (value !== undefined && option === value) {
          optionEl.selected = true;
        } else if (value === undefined && option === param.default) {
          optionEl.selected = true;
        }
        
        select.appendChild(optionEl);
      });
    }
    
    select.addEventListener('change', (e) => {
      onChange(e.target.value);
    });
    
    container.appendChild(label);
    container.appendChild(select);
    
    return container;
  }
  
  /**
   * Create a number input control
   * @param {ParameterDefinition} param - Parameter definition
   * @param {number} value - Current value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Number input control element
   */
  createNumberInput(param, value, onChange) {
    const container = this.createControlContainer();
    const label = this.createLabel(param.id, param.label);
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = param.id;
    input.value = value !== undefined ? value : param.default;
    
    if (param.min !== undefined) input.min = param.min;
    if (param.max !== undefined) input.max = param.max;
    if (param.step !== undefined) input.step = param.step;
    
    input.addEventListener('input', (e) => {
      onChange(parseFloat(e.target.value));
    });
    
    container.appendChild(label);
    container.appendChild(input);
    
    return container;
  }
  
  /**
   * Create a text input control
   * @param {ParameterDefinition} param - Parameter definition
   * @param {string} value - Current value
   * @param {Function} onChange - Change handler
   * @returns {HTMLElement} Text input control element
   */
  createTextInput(param, value, onChange) {
    const container = this.createControlContainer();
    const label = this.createLabel(param.id, param.label);
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = param.id;
    input.value = value !== undefined ? value : param.default;
    
    input.addEventListener('input', (e) => {
      onChange(e.target.value);
    });
    
    container.appendChild(label);
    container.appendChild(input);
    
    return container;
  }
  
  /**
   * Create an unsupported control type fallback
   * @param {ParameterDefinition} param - Parameter definition
   * @returns {HTMLElement} Unsupported control element
   */
  createUnsupportedControl(param) {
    const container = this.createControlContainer();
    
    const label = document.createElement('label');
    label.textContent = param.label;
    
    const message = document.createElement('p');
    message.textContent = `Unsupported control type: ${param.type}`;
    message.style.color = 'red';
    
    container.appendChild(label);
    container.appendChild(message);
    
    return container;
  }
  
  /**
   * Create a button
   * @param {string} id - Button ID
   * @param {string} label - Button text
   * @param {Function} onClick - Click handler
   * @returns {HTMLElement} Button element
   */
  createButton(id, label, onClick) {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = label;
    
    button.addEventListener('click', onClick);
    
    return button;
  }
  
  /**
   * Create a section header
   * @param {string} title - Section title
   * @returns {HTMLElement} Section header element
   */
  createSectionHeader(title) {
    const header = document.createElement('h3');
    header.textContent = title;
    header.className = 'section-header';
    return header;
  }
  
  /**
   * Create a notification toast
   * @param {string} message - Message to display
   * @param {number} duration - Duration in milliseconds
   * @returns {HTMLElement} Notification element
   */
  createNotification(message, duration = 3000) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => document.body.removeChild(n));
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Set styles
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '4px',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      fontFamily: 'sans-serif'
    });
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, duration);
    
    return notification;
  }
  
  /**
   * Create a loading indicator
   * @param {string} message - Loading message
   * @returns {HTMLElement} Loading indicator element
   */
  createLoadingIndicator(message = 'Loading...') {
    // Create container
    const container = document.createElement('div');
    container.className = 'loading-indicator';
    
    // Set styles
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000'
    });
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    
    // Set spinner styles
    Object.assign(spinner.style, {
      border: '5px solid #f3f3f3',
      borderTop: '5px solid #3498db',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      animation: 'spin 1s linear infinite'
    });
    
    // Add spinner keyframes if not already in document
    if (!document.getElementById('spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spinner-keyframes';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Create message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.color = 'white';
    messageEl.style.marginTop = '20px';
    messageEl.style.fontFamily = 'sans-serif';
    
    container.appendChild(spinner);
    container.appendChild(messageEl);
    
    return container;
  }
}
