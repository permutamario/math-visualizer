// Simple components using React.createElement instead of JSX

// Slider Component
function Slider({ id, label, value, min, max, step, onChange }) {
  return React.createElement('div', { className: 'control-item' },
    React.createElement('label', { className: 'control-label', htmlFor: id }, label),
    React.createElement('div', { className: 'slider-container' },
      React.createElement('input', {
        id,
        className: 'slider-input',
        type: 'range',
        min,
        max,
        step,
        value,
        onChange: (e) => onChange(parseFloat(e.target.value))
      }),
      React.createElement('span', { className: 'slider-value' }, value)
    )
  );
}

// Checkbox Component
function Checkbox({ id, label, checked, onChange }) {
  return React.createElement('div', { className: 'control-item' },
    React.createElement('label', { className: 'control-label' },
      React.createElement('input', {
        id,
        type: 'checkbox',
        checked,
        onChange: (e) => onChange(e.target.checked)
      }),
      ' ' + label
    )
  );
}

// Dropdown Component
function Dropdown({ id, label, value, options, onChange }) {
  return React.createElement('div', { className: 'control-item' },
    React.createElement('label', { className: 'control-label', htmlFor: id }, label),
    React.createElement('select', {
      id,
      value,
      onChange: (e) => onChange(e.target.value)
    }, options.map(option => 
      React.createElement('option', { 
        key: option.value, 
        value: option.value 
      }, option.label || option.value)
    ))
  );
}

// Color Picker Component
function ColorPicker({ id, label, color, onChange }) {
  return React.createElement('div', { className: 'control-item' },
    React.createElement('label', { className: 'control-label', htmlFor: id }, label),
    React.createElement('input', {
      id,
      type: 'color',
      value: color,
      onChange: (e) => onChange(e.target.value),
      style: { width: '100%', height: '30px' }
    })
  );
}

// Button Component
function Button({ id, label, onClick, className }) {
  return React.createElement('button', {
    id,
    className,
    onClick
  }, label);
}

// Parameter Panel Component
function ParameterPanel({ title, parameters }) {
  return React.createElement('div', { className: 'panel' },
    React.createElement('h3', { className: 'panel-header' }, title),
    React.createElement('div', { className: 'panel-content' },
      parameters.map(param => {
        if (param.type === 'slider') {
          return React.createElement(Slider, {
            key: param.id,
            id: param.id,
            label: param.label,
            value: param.value,
            min: param.min,
            max: param.max,
            step: param.step,
            onChange: (value) => console.log(`${param.id} changed to ${value}`)
          });
        } else if (param.type === 'checkbox') {
          return React.createElement(Checkbox, {
            key: param.id,
            id: param.id,
            label: param.label,
            checked: param.value,
            onChange: (value) => console.log(`${param.id} changed to ${value}`)
          });
        } else if (param.type === 'dropdown') {
          return React.createElement(Dropdown, {
            key: param.id,
            id: param.id,
            label: param.label,
            value: param.value,
            options: param.options,
            onChange: (value) => console.log(`${param.id} changed to ${value}`)
          });
        } else if (param.type === 'color') {
          return React.createElement(ColorPicker, {
            key: param.id,
            id: param.id,
            label: param.label,
            color: param.value,
            onChange: (value) => console.log(`${param.id} changed to ${value}`)
          });
        }
        // Add other control types as needed
        return null;
      })
    )
  );
}

// Actions Panel Component
function ActionsPanel({ actions }) {
  return React.createElement('div', { className: 'panel' },
    React.createElement('h3', { className: 'panel-header' }, 'Actions'),
    React.createElement('div', { className: 'panel-content' },
      actions.map(action => 
        React.createElement(Button, {
          key: action.id,
          id: action.id,
          label: action.label,
          onClick: () => console.log(`Action ${action.id} clicked`)
        })
      )
    )
  );
}

// Mobile Tab Bar Component
function MobileTabBar({ activeTab, onTabSelect }) {
  return React.createElement('div', { className: 'mobile-tab-bar' },
    React.createElement('div', { 
      className: `tab-item ${activeTab === 'visual' ? 'active' : ''}`,
      onClick: () => onTabSelect('visual')
    }, 'Visual'),
    
    React.createElement('div', { 
      className: `tab-item ${activeTab === 'structural' ? 'active' : ''}`,
      onClick: () => onTabSelect('structural')
    }, 'Structural'),
    
    React.createElement('div', { 
      className: `tab-item ${activeTab === 'actions' ? 'active' : ''}`,
      onClick: () => onTabSelect('actions')
    }, 'Actions')
  );
}

// Modal Component for Mobile
function ParameterModal({ title, parameters, actions, onClose }) {
  return React.createElement('div', { className: 'modal-overlay' },
    React.createElement('div', { className: 'modal-content' },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h3', null, title),
        React.createElement('button', { onClick: onClose }, '×')
      ),
      React.createElement('div', { className: 'modal-body' },
        parameters ? React.createElement(ParameterPanel, { 
          title: '',  // No title needed inside modal
          parameters: parameters
        }) : null,
        actions ? React.createElement(ActionsPanel, { 
          title: '',  // No title needed inside modal
          actions: actions
        }) : null
      ),
      React.createElement('div', { className: 'modal-footer' },
        React.createElement('button', { onClick: onClose }, 'Apply'),
        React.createElement('button', { 
          onClick: onClose,
          style: { backgroundColor: 'transparent', color: 'var(--text)' }
        }, 'Cancel')
      )
    )
  );
}

// Desktop Layout Component
function DesktopLayout() {
  return React.createElement('div', { className: 'app-container desktop-layout' },
    // Toolbar
    React.createElement('div', { className: 'toolbar' },
      React.createElement('div', { className: 'plugin-name' }, dummyData.activePlugin.name),
      React.createElement('div', { className: 'toolbar-controls' },
        React.createElement('button', null, 'Plugins'),
        React.createElement('button', null, 'Theme'),
        React.createElement('button', null, 'Fullscreen')
      )
    ),
    
    // Main Content with Canvas and Floating Panels
    React.createElement('div', { className: 'main-content' },
      // Canvas (fills entire space)
      React.createElement('div', { className: 'center-area' },
        React.createElement('div', null, 'Visualization Canvas')
      ),
      
      // Floating Left Sidebar
      React.createElement('div', { className: 'left-sidebar' },
        React.createElement('button', { className: 'collapse-button' }, '<'),
        React.createElement(ParameterPanel, { 
          title: 'Visual Parameters', 
          parameters: dummyData.visualParameters 
        })
      ),
      
      // Floating Top Right
      React.createElement('div', { className: 'top-right' },
        React.createElement('button', { className: 'collapse-button' }, '>'),
        React.createElement('h3', { className: 'panel-header' }, 'Selection Parameters')
      ),
      
      // Floating Bottom Right
      React.createElement('div', { className: 'bottom-right' },
        React.createElement('button', { className: 'collapse-button' }, '>'),
        React.createElement(ParameterPanel, { 
          title: 'Structural Parameters', 
          parameters: dummyData.structuralParameters 
        })
      ),
      
      // Floating Bottom Left - Actions
      React.createElement('div', { className: 'bottom-left' },
        React.createElement('button', { className: 'collapse-button' }, '<'),
        React.createElement(ActionsPanel, { actions: dummyData.actions })
      ),
      
      // Priority Controls Region (transparent)
      React.createElement('div', { className: 'priority-controls-region' },
        dummyData.priorityControls.map(control => {
          if (control.type === 'slider') {
            return React.createElement(Slider, {
              key: control.id,
              id: control.id,
              label: control.label,
              value: control.value,
              min: control.min,
              max: control.max,
              step: control.step,
              onChange: (value) => console.log(`${control.id} changed to ${value}`)
            });
          } else if (control.type === 'checkbox') {
            return React.createElement(Checkbox, {
              key: control.id,
              id: control.id,
              label: control.label,
              checked: control.value,
              onChange: (value) => console.log(`${control.id} changed to ${value}`)
            });
          }
          return null;
        })
      )
    )
  );
}

// Mobile Layout Component
function MobileLayout() {
  // Without React state hooks, we'll use a basic simulation
  let activeTab = null;
  const setActiveTab = (tab) => {
    console.log(`Tab selected: ${tab}`);
    // In a real implementation, this would update state and re-render
  };
  
  return React.createElement('div', { className: 'app-container mobile-layout' },
    // Mobile Header
    React.createElement('div', { className: 'mobile-header' },
      React.createElement('div', null, dummyData.activePlugin.name),
      React.createElement('button', null, 'Settings')
    ),
    
    // Parameter Selection Bar
    React.createElement('div', { className: 'parameter-selection-bar' },
      React.createElement('select', null,
        React.createElement('option', null, 'Basic View'),
        React.createElement('option', null, 'Advanced View')
      ),
      React.createElement('select', null,
        React.createElement('option', null, 'Default Preset'),
        React.createElement('option', null, 'Preset 1'),
        React.createElement('option', null, 'Preset 2')
      )
    ),
    
    // Canvas
    React.createElement('div', { className: 'mobile-canvas' },
      React.createElement('div', null, 'Visualization Canvas')
    ),
    
    // Priority Controls Region (transparent)
    React.createElement('div', { className: 'mobile-controls-bar' },
      React.createElement(Slider, {
        id: 'mobile-time',
        label: 'Time',
        value: 0,
        min: 0,
        max: 10,
        step: 0.1,
        onChange: (value) => console.log(`Time changed to ${value}`)
      })
    ),
    
    // Tab Bar
    React.createElement(MobileTabBar, { 
      activeTab: activeTab,
      onTabSelect: setActiveTab
    })
    
    // Modal would be rendered conditionally when a tab is selected
    // (Not included here since we don't have state management)
  );
}

// App Component - Shows desktop or mobile layout based on screen size
function App() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? 
    React.createElement(MobileLayout) : 
    React.createElement(DesktopLayout);
}
