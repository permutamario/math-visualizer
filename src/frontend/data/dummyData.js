export const dummyData = {
  activePlugin: {
    id: 'sine-wave-visualization',
    name: 'Sine Wave Visualization',
    description: 'Interactive sine wave visualization with adjustable parameters'
  },
  
  plugins: [
    {
      id: 'sine-wave-visualization',
      name: 'Sine Wave Visualization',
      description: 'Interactive sine wave visualization with adjustable parameters'
    },
    {
      id: 'mandelbrot-explorer',
      name: 'Mandelbrot Explorer',
      description: 'Interactive exploration of the Mandelbrot set'
    },
    {
      id: '3d-function-grapher',
      name: '3D Function Grapher',
      description: 'Visualize 3D mathematical functions'
    }
  ],
  
  visualParameters: [
    {
      id: 'amplitude',
      type: 'slider',
      label: 'Amplitude',
      value: 1.0,
      min: 0,
      max: 2,
      step: 0.1
    },
    {
      id: 'waveColor',
      type: 'color',
      label: 'Wave Color',
      value: '#3498db'
    },
    {
      id: 'showGuideLines',
      type: 'checkbox',
      label: 'Show Guide Lines',
      value: true
    },
    {
      id: 'lineStyle',
      type: 'dropdown',
      label: 'Line Style',
      value: 'solid',
      options: [
        { value: 'solid', label: 'Solid' },
        { value: 'dashed', label: 'Dashed' },
        { value: 'dotted', label: 'Dotted' }
      ]
    }
  ],
  
  structuralParameters: [
    {
      id: 'frequency',
      type: 'slider',
      label: 'Frequency',
      value: 1.0,
      min: 0.1,
      max: 5,
      step: 0.1
    },
    {
      id: 'phaseShift',
      type: 'slider',
      label: 'Phase Shift',
      value: 0,
      min: -Math.PI,
      max: Math.PI,
      step: 0.1
    },
    {
      id: 'waveType',
      type: 'dropdown',
      label: 'Wave Type',
      value: 'sine',
      options: [
        { value: 'sine', label: 'Sine' },
        { value: 'cosine', label: 'Cosine' },
        { value: 'square', label: 'Square' },
        { value: 'sawtooth', label: 'Sawtooth' }
      ]
    },
    {
      id: 'numberOfWaves',
      type: 'slider',
      label: 'Number of Waves',
      value: 2,
      min: 1,
      max: 10,
      step: 1
    }
  ],
  
  selectionParameters: [
    {
      id: 'parameterView',
      type: 'dropdown',
      label: 'Parameter View',
      value: 'basic',
      options: [
        { value: 'basic', label: 'Basic' },
        { value: 'advanced', label: 'Advanced' }
      ]
    },
    {
      id: 'presets',
      type: 'dropdown',
      label: 'Presets',
      value: 'default',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'lowFrequency', label: 'Low Frequency' },
        { value: 'highFrequency', label: 'High Frequency' },
        { value: 'custom', label: 'Custom' }
      ]
    }
  ],
  
  priorityControls: [
    {
      id: 'timeSlider',
      type: 'slider',
      label: 'Time',
      value: 0,
      min: 0,
      max: 10,
      step: 0.1
    },
    {
      id: 'animate',
      type: 'checkbox',
      label: 'Animate',
      value: true
    },
    {
      id: 'speed',
      type: 'slider',
      label: 'Speed',
      value: 1,
      min: 0.1,
      max: 5,
      step: 0.1
    }
  ],
  
  actions: [
    {
      id: 'reset',
      label: 'Reset',
      icon: 'refresh'
    },
    {
      id: 'exportImage',
      label: 'Export Image',
      icon: 'download'
    },
    {
      id: 'toggleFullscreen',
      label: 'Fullscreen',
      icon: 'fullscreen'
    }
  ]
};
