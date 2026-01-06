import React, { useEffect, useState } from 'react';
import { Droppable, DroppableProps } from 'react-beautiful-dnd';

/**
 * StrictModeDroppable - A wrapper for react-beautiful-dnd's Droppable component
 * that fixes compatibility issues with React 18's StrictMode.
 * 
 * react-beautiful-dnd was built before React 18 and has compatibility issues
 * with StrictMode's double-rendering behavior. This wrapper delays the rendering
 * of the Droppable until after the initial mount cycle.
 */
export const StrictModeDroppable: React.FC<DroppableProps> = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Small delay to allow React's hydration and layout effects to complete
    const animationFrame = window.requestAnimationFrame(() => {
      setEnabled(true);
    });
    
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

export default StrictModeDroppable;

