// src/core/utils.js
// Utility functions: platform detection, debounce, throttle, and simple event emitter.

/**
 * Detect if running on mobile device
 * @returns {boolean} True if on mobile, false otherwise
 */
export function detectPlatform() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Debounce function: delays invoking fn until after wait ms have elapsed since last call
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, wait = 100) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle function: invokes fn at most once per limit ms
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Simple EventEmitter for pub/sub pattern
 */
export class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} listener - Event handler
   */
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} listener - Event handler to remove
   */
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {*} payload - Data to pass to event handlers
   */
  emit(event, payload) {
    (this.events[event] || []).slice().forEach(l => l(payload));
  }
}

/**
 * Show a temporary notification toast
 * @param {string} message - Message to display
 * @param {number} duration - How long to show in milliseconds
 */
export function showNotification(message, duration = 3000) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => document.body.removeChild(n));
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, duration);
}
