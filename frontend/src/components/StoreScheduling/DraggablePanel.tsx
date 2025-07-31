import React, { useState, useRef, useEffect } from 'react';
import { X, Move, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraggablePanelProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  className?: string;
  isMinimized?: boolean;
  isMaximized?: boolean;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  title,
  icon,
  children,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 400, height: 300 },
  minSize = { width: 300, height: 200 },
  maxSize = { width: 800, height: 600 },
  onClose,
  onMinimize,
  onMaximize,
  className,
  isMinimized = false,
  isMaximized = false,
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');
  
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Load saved position and size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`panel-${id}`);
    if (saved) {
      try {
        const { position: savedPosition, size: savedSize } = JSON.parse(saved);
        setPosition(savedPosition);
        setSize(savedSize);
      } catch (error) {
        console.warn('Failed to load panel position/size:', error);
      }
    }
  }, [id]);

  // Save position and size to localStorage
  const savePanelState = (newPosition: typeof position, newSize: typeof size) => {
    localStorage.setItem(`panel-${id}`, JSON.stringify({
      position: newPosition,
      size: newSize,
    }));
  };

  // Handle mouse down on header for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== headerRef.current && !headerRef.current?.contains(e.target as Node)) {
      return;
    }
    
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      const newPosition = { x: constrainedX, y: constrainedY };
      setPosition(newPosition);
      savePanelState(newPosition, size);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, size]);

  // Handle resize
  const handleResizeStart = (direction: string) => {
    setIsResizing(true);
    setResizeDirection(direction);
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newWidth = size.width;
      let newHeight = size.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeDirection.includes('e')) {
        newWidth = e.clientX - rect.left;
      }
      if (resizeDirection.includes('w')) {
        newWidth = rect.right - e.clientX;
        newX = e.clientX;
      }
      if (resizeDirection.includes('s')) {
        newHeight = e.clientY - rect.top;
      }
      if (resizeDirection.includes('n')) {
        newHeight = rect.bottom - e.clientY;
        newY = e.clientY;
      }

      // Apply constraints
      newWidth = Math.max(minSize.width, Math.min(newWidth, maxSize.width));
      newHeight = Math.max(minSize.height, Math.min(newHeight, maxSize.height));

      const newSize = { width: newWidth, height: newHeight };
      const newPosition = { x: newX, y: newY };

      setSize(newSize);
      setPosition(newPosition);
      savePanelState(newPosition, newSize);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, resizeDirection, position, size, minSize, maxSize]);

  if (isMinimized) {
    return (
      <div
        ref={panelRef}
        className={cn(
          'fixed z-50 bg-background border rounded-lg shadow-lg cursor-move',
          isDragging && 'select-none',
          className
        )}
        style={{
          left: position.x,
          top: position.y,
          width: 200,
          height: 40,
        }}
        onMouseDown={handleMouseDown}
      >
        <div
          ref={headerRef}
          className="flex items-center justify-between px-3 py-2 h-full"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </div>
          <div className="flex items-center gap-1">
            {onMaximize && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onMaximize}
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-50 bg-background border rounded-lg shadow-lg',
        isDragging && 'select-none',
        isResizing && 'select-none',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className="flex items-center justify-between px-4 py-2 border-b cursor-move bg-muted/50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-muted-foreground" />
          {icon}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onMinimize}
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
          )}
          {onMaximize && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onMaximize}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={onClose}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="h-full overflow-auto">
        {children}
      </div>

      {/* Resize handles */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={() => handleResizeStart('se')}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
        onMouseDown={() => handleResizeStart('sw')}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
        onMouseDown={() => handleResizeStart('ne')}
      />
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
        onMouseDown={() => handleResizeStart('nw')}
      />
      <div
        className="absolute top-0 left-4 right-4 h-2 cursor-n-resize"
        onMouseDown={() => handleResizeStart('n')}
      />
      <div
        className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
        onMouseDown={() => handleResizeStart('s')}
      />
      <div
        className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"
        onMouseDown={() => handleResizeStart('w')}
      />
      <div
        className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"
        onMouseDown={() => handleResizeStart('e')}
      />
    </div>
  );
}; 