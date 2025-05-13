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
      tension = 0.5,
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
      tension = 0.5, 
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
      if (curve.isCompleted && curveStyle === 'curved') {
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
    
    // For non-animation paths, apply spline if needed
    const useSpline = !curve.isCompleted && 
                     smooth && 
                     isClosed &&
                     curve.type !== 'animationPath' && 
                     curveStyle === 'curved';
    
    const drawPoints = useSpline 
        ? getSplinePoints(points, tension)
        : points;
    
    // Convert points to flat array for Konva
    const flatPoints = [];
    drawPoints.forEach(point => {
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
    if (!curve || !curve.gridLines) {
      return null;
    }
    
    // Calculate current segment and progress
    const currentSegment = Math.floor(animationFrame / frameCount);
    const progress = (animationFrame % frameCount) / frameCount;
    
    // Stop animation if we've reached the end of the curve
    if (currentSegment >= curve.gridLines.length) {
      return { completed: true };
    }
    
    // Create partial animation path
    const segmentCount = Math.min(currentSegment + 1, curve.gridLines.length);
    
    // Create animation path with current segments
    const points = [];
    for (let i = 0; i < segmentCount; i++) {
      const line = curve.gridLines[i];
      let x, y;
      
      if (line.type === 'horizontal') {
        x = (line.col + 0.5) * cellSize;
        y = line.row * cellSize;
      } else { // vertical
        x = line.col * cellSize;
        y = (line.row + 0.5) * cellSize;
      }
      
      points.push({ x, y });
    }
    
    // For the last segment, interpolate based on progress
    if (segmentCount < curve.gridLines.length) {
      const nextLine = curve.gridLines[segmentCount];
      let nextX, nextY;
      
      if (nextLine.type === 'horizontal') {
        nextX = (nextLine.col + 0.5) * cellSize;
        nextY = nextLine.row * cellSize;
      } else { // vertical
        nextX = nextLine.col * cellSize;
        nextY = (nextLine.row + 0.5) * cellSize;
      }
      
      const lastPoint = points[points.length - 1];
      const interpX = lastPoint.x + (nextX - lastPoint.x) * progress;
      const interpY = lastPoint.y + (nextY - lastPoint.y) * progress;
      
      points.push({ x: interpX, y: interpY });
    }
    
    return {
      type: 'animationPath',
      points: points,
      isClosed: false,
      completed: false
    };
  }
}
