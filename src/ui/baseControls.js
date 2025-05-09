// src/ui/baseControls.js
// Factory functions for UI controls

/**
 * Create a container for a control
 * @returns {HTMLElement} Control container div
 */
function createControlContainer() {
  const container = document.createElement('div');
  container.className = 'control';
  return container;
}

/**
 * Create a label element
 * @param {string} id - ID of the input this label is for
 * @param {string} text - Label text
 * @returns {HTMLElement} Label element
 */
function createLabel(id, text) {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = text;
  return label;
}

/**
 * Create a slider control
 * @param {Object} options - Slider options
 * @param {string} options.id - Input ID
 * @param {string} options.label - Label text
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {number} options.step - Step value
 * @param {number} options.value - Current value
 * @param {Function} options.onChange - Change handler function
 * @returns {HTMLElement} Slider control element
 */
export function createSlider({ id, label, min, max, step, value, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.addEventListener('input', e => onChange(parseFloat(e.target.value)));
  container.appendChild(lbl);
  container.appendChild(input);
  return container;
}

/**
 * Create a checkbox control
 * @param {Object} options - Checkbox options
 * @param {string} options.id - Input ID
 * @param {string} options.label - Label text
 * @param {boolean} options.checked - Checked state
 * @param {Function} options.onChange - Change handler function
 * @returns {HTMLElement} Checkbox control element
 */
export function createCheckbox({ id, label, checked = false, onChange }) {
  const container = document.createElement('div');
  container.className = 'control checkbox-container';
  
  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;
  
  input.addEventListener('change', e => {
    if (onChange) onChange(e.target.checked);
  });
  
  container.appendChild(labelEl);
  container.appendChild(input);
  
  return container;
}

/**
 * Create a color picker control
 * @param {Object} options - Color picker options
 * @param {string} options.id - Input ID
 * @param {string} options.label - Label text
 * @param {string} options.value - Current color value
 * @param {Function} options.onChange - Change handler function
 * @returns {HTMLElement} Color picker control element
 */
export function createColorPicker({ id, label, value, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const input = document.createElement('input');
  input.type = 'color';
  input.id = id;
  input.value = value;
  input.addEventListener('input', e => onChange(e.target.value));
  container.appendChild(lbl);
  container.appendChild(input);
  return container;
}

/**
 * Create a dropdown control
 * @param {Object} options - Dropdown options
 * @param {string} options.id - Input ID
 * @param {string} options.label - Label text
 * @param {string[]} options.options - Dropdown options
 * @param {string} options.value - Current value
 * @param {Function} options.onChange - Change handler function
 * @returns {HTMLElement} Dropdown control element
 */
export function createDropdown({ id, label, options, value, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const select = document.createElement('select');
  select.id = id;
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    if (opt === value) el.selected = true;
    select.appendChild(el);
  });
  select.addEventListener('change', e => onChange(e.target.value));
  container.appendChild(lbl);
  container.appendChild(select);
  return container;
}

/**
 * Create a button control
 * @param {Object} options - Button options
 * @param {string} options.id - Button ID
 * @param {string} options.label - Button text
 * @param {Function} options.onClick - Click handler function
 * @returns {HTMLElement} Button element
 */
export function createButton({ id, label, onClick }) {
  const btn = document.createElement('button');
  btn.id = id;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Create a number input control
 * @param {Object} options - Number input options
 * @param {string} options.id - Input ID
 * @param {string} options.label - Label text
 * @param {number} options.value - Current value
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {number} options.step - Step value
 * @param {Function} options.onChange - Change handler function
 * @returns {HTMLElement} Number input control element
 */
export function createNumberInput({ id, label, value, min, max, step, onChange }) {
  const container = createControlContainer();
  const lbl = createLabel(id, label);
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.value = value;
  if (min !== undefined) input.min = min;
  if (max !== undefined) input.max = max;
  if (step !== undefined) input.step = step;
  input.addEventListener('input', e => onChange(parseFloat(e.target.value)));
  container.appendChild(lbl);
  container.appendChild(input);
  return container;
}

/**
 * Create a vector (multiple values) input with compute button
 * @param {Object} options - Vector input options
 * @param {string} options.id - Input ID
 * @param {string} options.label - Label text
 * @param {number[]} options.value - Current vector values
 * @param {Function} options.onChange - Change handler function
 * @returns {HTMLElement} Vector input control element
 */
export function createVectorInput({ id, label, value, onChange }) {
  const container = document.createElement('div');
  container.className = 'control';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  container.appendChild(labelEl);

  // Row wrapper for input + button
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.alignItems = 'center';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.value = Array.isArray(value) ? value.join(', ') : '';
  input.style.flex = '1 1 auto';
  input.style.minWidth = '60px';

  const button = document.createElement('button');
  button.textContent = 'Apply';
  button.style.whiteSpace = 'nowrap';

  button.addEventListener('click', () => {
    const tokens = input.value.split(',').map(s => s.trim());
    const nums = tokens.map(Number);
    const isValid = nums.length === tokens.length && nums.every(n => !isNaN(n));
    if (isValid) {
      onChange(nums);
    } else {
      input.classList.add('invalid');
      setTimeout(() => input.classList.remove('invalid'), 1500);
    }
  });

  row.appendChild(input);
  row.appendChild(button);
  container.appendChild(row);
  return container;
}
