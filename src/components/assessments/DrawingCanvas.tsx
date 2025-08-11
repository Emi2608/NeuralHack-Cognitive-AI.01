import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonAlert
} from '@ionic/react';
import { 
  brush, 
  trash, 
  refresh, 
  checkmark,
  informationCircle 
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { DrawingData, Stroke, Point } from '../../types/assessment';
import './DrawingCanvas.css';

interface DrawingCanvasProps {
  value?: DrawingData;
  onChange: (value: DrawingData) => void;
  disabled?: boolean;
  instructions?: string;
  timeLimit?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  value,
  onChange,
  disabled = false,
  instructions,
  timeLimit
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawingStartTime, setDrawingStartTime] = useState<number>(Date.now());
  const [showClearAlert, setShowClearAlert] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw existing strokes if any
    if (value?.strokes) {
      redrawCanvas(value.strokes);
    }
  }, [value]);

  const redrawCanvas = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });
  }, []);

  const getEventPosition = useCallback((event: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, timestamp: Date.now() };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      timestamp: Date.now()
    };
  }, []);

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    event.preventDefault();
    setIsDrawing(true);

    const point = getEventPosition(event);
    const newStroke: Stroke = {
      points: [point],
      timestamp: Date.now(),
      pressure: 'pressure' in event ? (event as any).pressure : 1
    };

    setCurrentStroke(newStroke);
  }, [disabled, getEventPosition]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke || disabled) return;

    event.preventDefault();
    const point = getEventPosition(event);
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    };

    setCurrentStroke(updatedStroke);

    // Draw on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevPoint = currentStroke.points[currentStroke.points.length - 1];
    ctx.beginPath();
    ctx.moveTo(prevPoint.x, prevPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }, [isDrawing, currentStroke, disabled, getEventPosition]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentStroke) return;

    setIsDrawing(false);

    // Add completed stroke to drawing data
    const existingStrokes = value?.strokes || [];
    const newDrawingData: DrawingData = {
      strokes: [...existingStrokes, currentStroke],
      canvasSize: {
        width: canvasRef.current?.width || 0,
        height: canvasRef.current?.height || 0
      },
      totalTime: Date.now() - drawingStartTime
    };

    onChange(newDrawingData);
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, value, onChange, drawingStartTime]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset drawing data
    const newDrawingData: DrawingData = {
      strokes: [],
      canvasSize: {
        width: canvas.width,
        height: canvas.height
      },
      totalTime: 0
    };

    onChange(newDrawingData);
    setDrawingStartTime(Date.now());
    setShowClearAlert(false);
  }, [onChange]);

  const undoLastStroke = useCallback(() => {
    if (!value?.strokes || value.strokes.length === 0) return;

    const newStrokes = value.strokes.slice(0, -1);
    const newDrawingData: DrawingData = {
      ...value,
      strokes: newStrokes
    };

    onChange(newDrawingData);
    redrawCanvas(newStrokes);
  }, [value, onChange, redrawCanvas]);

  return (
    <div className="drawing-canvas-container">
      {instructions && (
        <IonCard className="instructions-card">
          <IonCardContent>
            <div className="instructions">
              <IonIcon icon={informationCircle} color="primary" />
              <IonText>
                <p>{instructions}</p>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className={`drawing-canvas ${disabled ? 'disabled' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            width: '100%',
            height: '300px',
            border: '2px solid #ccc',
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'crosshair'
          }}
        />
      </div>

      <div className="canvas-controls">
        <IonButtons>
          <IonButton
            fill="clear"
            onClick={undoLastStroke}
            disabled={disabled || !value?.strokes || value.strokes.length === 0}
          >
            <IonIcon icon={refresh} />
            {t('drawing.undo')}
          </IonButton>

          <IonButton
            fill="clear"
            color="danger"
            onClick={() => setShowClearAlert(true)}
            disabled={disabled || !value?.strokes || value.strokes.length === 0}
          >
            <IonIcon icon={trash} />
            {t('drawing.clear')}
          </IonButton>
        </IonButtons>
      </div>

      {/* Drawing stats */}
      {value && (
        <div className="drawing-stats">
          <IonText color="medium">
            <small>
              {t('drawing.stats', {
                strokes: value.strokes.length,
                time: Math.round(value.totalTime / 1000)
              })}
            </small>
          </IonText>
        </div>
      )}

      {/* Clear confirmation alert */}
      <IonAlert
        isOpen={showClearAlert}
        onDidDismiss={() => setShowClearAlert(false)}
        header={t('drawing.clear.title')}
        message={t('drawing.clear.message')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel'
          },
          {
            text: t('drawing.clear.confirm'),
            handler: clearCanvas
          }
        ]}
      />
    </div>
  );
};