// src/rendering/AnimationManager.js

/**
* Manages animation timing, frame updates, and animation state
* Provides a clean API for plugins to animate their content
*/
export class AnimationManager {
 /**
  * Create a new AnimationManager
  * @param {AppCore} core - Reference to the application core
  */
 constructor(core) {
   this.core = core;
   
   // Animation state
   this.animating = false;
   this.animationId = null;
   this.lastFrameTime = 0;
   this.frameDelta = 0;
   
   // Performance monitoring
   this.fpsHistory = [];
   this.averageFps = 60;
   this.frameCount = 0;
   this.lastFpsUpdate = 0;
   this.displayFps = 60;
   
   // Animation request queue
   this.animationQueue = new Set();
   this.singleFrameQueue = new Set();
   
   // Debug flag
   this.debug = false;
   
   // Bind methods
   this.animate = this.animate.bind(this);
   this.requestAnimation = this.requestAnimation.bind(this);
   this.cancelAnimation = this.cancelAnimation.bind(this);
   this.requestFrame = this.requestFrame.bind(this);
 }
 
 /**
  * Initialize the animation manager
  * @returns {Promise<boolean>} Whether initialization was successful
  */
 async initialize() {
   try {
     console.log("Initializing AnimationManager...");
     
     // Add a global accessor for plugins if debug mode is enabled
     if (this.debug) {
       window.animationManager = this;
     }
     
     console.log("AnimationManager initialized successfully");
     return true;
   } catch (error) {
     console.error("Failed to initialize animation manager:", error);
     return false;
   }
 }
 
 /**
  * Start the animation loop
  * Called automatically when animations are requested
  * @private
  */
 _startAnimationLoop() {
   if (this.animating) return;
   
   this.animating = true;
   this.lastFrameTime = performance.now();
   this.animationId = requestAnimationFrame(this.animate);
   
   if (this.debug) {
     console.log("Animation loop started");
   }
 }
 
 /**
  * Stop the animation loop
  * Called automatically when no more animations are active
  * @private
  */
 _stopAnimationLoop() {
   if (!this.animating) return;
   
   cancelAnimationFrame(this.animationId);
   this.animationId = null;
   this.animating = false;
   
   if (this.debug) {
     console.log("Animation loop stopped");
   }
 }
 
 /**
  * Animation loop callback
  * @param {number} timestamp - Current timestamp from requestAnimationFrame
  * @private
  */
 animate(timestamp) {
   // Calculate delta time in seconds
   const deltaTime = (timestamp - this.lastFrameTime) / 1000; 
   this.lastFrameTime = timestamp;
   this.frameDelta = deltaTime;
   
   // Update FPS counter
   this._updateFpsStats(timestamp, deltaTime);
   
   // Process animations in queue
   let continueAnimating = false;
   
   // Process continuous animations
   for (const animationId of this.animationQueue) {
     try {
       // Get the animation callback and execute it
       const callback = animationId;
       if (typeof callback === 'function') {
         // Call the animation function with delta time
         const result = callback(deltaTime);
         
         // If callback returns false, remove from queue
         if (result === false) {
           this.animationQueue.delete(animationId);
         } else {
           continueAnimating = true;
         }
       }
     } catch (error) {
       console.error("Error in animation callback:", error);
       // Remove problematic animation from queue
       this.animationQueue.delete(animationId);
     }
   }
   
   // Process single frame requests
   for (const callback of this.singleFrameQueue) {
     try {
       if (typeof callback === 'function') {
         callback(deltaTime);
       }
     } catch (error) {
       console.error("Error in single frame callback:", error);
     }
   }
   
   // Clear single frame queue
   this.singleFrameQueue.clear();
   
   // Check if we need to continue the animation loop
   if (continueAnimating || this.singleFrameQueue.size > 0) {
     // Continue animation loop
     this.animationId = requestAnimationFrame(this.animate);
   } else {
     // Stop animation loop when no more animations are active
     this._stopAnimationLoop();
   }
   
   // Always request a render refresh
   if (this.core && typeof this.core.requestRenderRefresh === 'function') {
     this.core.requestRenderRefresh();
   }
 }
 
 /**
  * Update FPS statistics
  * @param {number} timestamp - Current timestamp
  * @param {number} deltaTime - Time since last frame in seconds
  * @private
  */
 _updateFpsStats(timestamp, deltaTime) {
   // Increment frame counter
   this.frameCount++;
   
   // Calculate instantaneous FPS
   const instantFps = 1 / deltaTime;
   
   // Add to history (limited to 60 frames)
   this.fpsHistory.push(instantFps);
   if (this.fpsHistory.length > 60) {
     this.fpsHistory.shift();
   }
   
   // Update average FPS
   this.averageFps = this.fpsHistory.reduce((sum, value) => sum + value, 0) / 
                    this.fpsHistory.length;
   
   // Update display FPS every second
   if (timestamp - this.lastFpsUpdate > 1000) {
     this.displayFps = Math.round(this.averageFps);
     this.lastFpsUpdate = timestamp;
     this.frameCount = 0;
   }
 }
 
 /**
  * Request continuous animation
  * @param {Function} callback - Animation callback function that receives deltaTime
  *                             Return false to stop the animation
  * @returns {Function} The callback function (for cancellation reference)
  */
 requestAnimation(callback) {
   if (typeof callback !== 'function') {
     console.error("Animation callback must be a function");
     return null;
   }
   
   // Add to animation queue
   this.animationQueue.add(callback);
   
   // Start animation loop if not already running
   if (!this.animating) {
     this._startAnimationLoop();
   }
   
   // Return the callback for later cancellation
   return callback;
 }
 
 /**
  * Cancel a previously requested animation
  * @param {Function} callback - Animation callback to cancel
  */
 cancelAnimation(callback) {
   if (this.animationQueue.has(callback)) {
     this.animationQueue.delete(callback);
     
     if (this.debug) {
       console.log("Animation cancelled");
     }
     
     // Stop animation loop if no more animations are active
     if (this.animationQueue.size === 0 && this.singleFrameQueue.size === 0) {
       this._stopAnimationLoop();
     }
   }
 }
 
 /**
  * Request a single animation frame
  * @param {Function} callback - Callback function that receives deltaTime
  */
 requestFrame(callback) {
   if (typeof callback !== 'function') {
     console.error("Frame callback must be a function");
     return;
   }
   
   // Add to single frame queue
   this.singleFrameQueue.add(callback);
   
   // Start animation loop if not already running
   if (!this.animating) {
     this._startAnimationLoop();
   }
 }
 
 /**
  * Get current FPS (frames per second)
  * @returns {number} Current FPS
  */
 getFps() {
   return this.displayFps;
 }
 
 /**
  * Get delta time (time since last frame in seconds)
  * @returns {number} Delta time in seconds
  */
 getDeltaTime() {
   return this.frameDelta;
 }
 
 /**
  * Check if animation loop is currently running
  * @returns {boolean} Whether animation is active
  */
 isAnimating() {
   return this.animating;
 }
 
 /**
  * Get the count of active animations
  * @returns {number} Number of active animations
  */
 getActiveAnimationCount() {
   return this.animationQueue.size;
 }
 
 /**
  * Enable or disable debug mode
  * @param {boolean} enabled - Whether to enable debug mode
  */
 setDebugMode(enabled) {
   this.debug = !!enabled;
   
   // Add or remove global accessor
   if (this.debug) {
     window.animationManager = this;
   } else if (window.animationManager === this) {
     delete window.animationManager;
   }
 }
 
 /**
  * Clean up resources when the manager is no longer needed
  */
 cleanup() {
   // Stop animation loop
   if (this.animating) {
     cancelAnimationFrame(this.animationId);
     this.animationId = null;
     this.animating = false;
   }
   
   // Clear animation queues
   this.animationQueue.clear();
   this.singleFrameQueue.clear();
   
   // Reset state
   this.fpsHistory = [];
   this.averageFps = 60;
   this.frameCount = 0;
   this.lastFpsUpdate = 0;
   this.displayFps = 60;
   
   // Remove global accessor if in debug mode
   if (window.animationManager === this) {
     delete window.animationManager;
   }
   
   console.log("Animation manager cleaned up");
 }
}