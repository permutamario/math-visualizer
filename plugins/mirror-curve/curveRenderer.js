// plugins/mirror-curve/curveRenderer.js
import { getSplinePoints } from './spline.js';
import { findHelperPoint } from './helperPointCalculator.js';

export class CurveRenderer {
  constructor(konva) {
    this.konva = konva;
    this.styleSettings = {
      lineStyles: {
        curve: { width: 3 },
        helperPoint: { radius: 4 }
      }
    };
  }

  renderCurves(curves, group, options) {
    // Clear the group
    group.destroyChildren();
    
    const {
      cellSize = 1,
      curveColor = '#3498db',
      curveStyle = 'curved',
      tension = 0,
      smooth = true,
      showHelperPoints = false,
      helperPointColor = '#ff0000',
      animationPath = null,
      helperPoints = []
    } = options;
    
    // Color scheme
    const colorScheme = [curveColor];
    
    // Draw completed curves
    curves.forEach((curve, idx) => {
      const konvaCurve = this.createKonvaCurve(curve, idx, cellSize, colorScheme, {
        curveStyle, tension, smooth
      });
      
      if (konvaCurve) {
        group.add(konvaCurve);
      }
    });
    
    // Draw animation path if it exists
    if (animationPath) {
      const animCurve = this.createKonvaCurve(
        animationPath, 
        curves.length, 
        cellSize, 
        colorScheme,
        { curveStyle, tension, smooth }
      );
      
      if (animCurve) {
        group.add(animCurve);
      }
    }
    
    // Draw helper points if enabled
    if (showHelperPoints) {
      const helperPointRadius = this.styleSettings.lineStyles.helperPoint.radius;
      
      // Add helper points for all curves
      helperPoints.forEach(curvePoints => {
        curvePoints.forEach(point => {
          const helperPoint = new this.konva.Circle({
            x: point.x,
            y: point.y,
            radius: helperPointRadius,
            fill: helperPointColor
          });
          
          group.add(helperPoint);
        });
      });
    }
  }

  createKonvaCurve(curve, idx, cellSize, colorScheme, options) {
    if (!curve) return null;
    
    const { 
      curveStyle = 'curved', 
      tension = 0, 
      smooth = true 
    } = options;
    
    // Extract points from the curve
    let points = [];
    let isClosed = false;
    
    // Parse the points based on curve type
    if (curve.type === 'animationPath') {
      points = curve.points || [];
      isClosed = curve.isClosed || false;
    }
    else if (curve.gridLines && Array.isArray(curve.gridLines)) {
      isClosed = curve.isClosed || false;
      
      // Generate points based on curve style
      if (curveStyle === 'curved') {
        // Calculate helper points with offsets for smooth curves
        const helperPointsForCurve = curve.gridLines.map((line, index) => {
          const direction = curve.directions[index];
          return findHelperPoint(line, direction, cellSize);
        });
        
        // Apply spline for smooth curves
        points = getSplinePoints(helperPointsForCurve, tension, 10);
      } else {
        // Use regular midpoints for jagged style
        points = curve.gridLines.map(line => {
          if (line.type === 'horizontal') {
            return {
              x: (line.col + 0.5) * cellSize,
              y: line.row * cellSize
            };
          } else { // vertical
            return {
              x: line.col * cellSize,
              y: (line.row + 0.5) * cellSize
            };
          }
        });
      }
    }
    
    // Skip if no points
    if (points.length === 0) return null;
    
    // Convert points to flat array for Konva
    const flatPoints = [];
    points.forEach(point => {
      flatPoints.push(point.x, point.y);
    });
    
    // Create Konva line
    const curveWidth = this.styleSettings.lineStyles.curve.width;
    const color = colorScheme[idx % colorScheme.length];
    
    const konvaLine = new this.konva.Line({
      points: flatPoints,
      stroke: color,
      strokeWidth: curveWidth,
      lineCap: 'round',
      lineJoin: 'round',
      closed: isClosed
    });
    
    return konvaLine;
  }

  createAnimationPath(curve, cellSize, animationFrame, frameCount) {
    if (!curve || !curve.gridLines || curve.gridLines.length === 0) {
      return null;
    }
    
    // First, create the complete curve path
    const useCurvedStyle = true; // Always use curved style for animation
    
    // Get all helper points for the full curve
    const allHelperPoints = curve.gridLines.map((line, index) => {
      const direction = curve.directions[index];
      return findHelperPoint(line, direction, cellSize);
    });
    
    // Generate the complete spline path
    const allSplinePoints = getSplinePoints(allHelperPoints, 0, 10);
    
    // Calculate how many points to show based on animation progress
    const totalPoints = allSplinePoints.length;
    const totalFrames = frameCount * curve.gridLines.length;
    const progress = Math.min(1.0, animationFrame / totalFrames);
    const pointsToShow = Math.max(2, Math.ceil(totalPoints * progress));
    
    // Check if animation is complete
    if (progress >= 1.0) {
      return { completed: true };
    }
    
    // Get the visible portion of the points
    const visiblePoints = allSplinePoints.slice(0, pointsToShow);
    
    return {
      type: 'animationPath',
      points: visiblePoints,
      isClosed: false,
      completed: false
    };
  }
}
