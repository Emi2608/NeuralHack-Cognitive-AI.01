import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonText,
  IonIcon,
  IonAlert
} from '@ionic/react';
import { refresh, checkmark, informationCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import './TrailMakingTask.css';

interface TrailMakingTaskProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

interface TrailPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  connected: boolean;
  order: number;
}

interface TrailConnection {
  from: string;
  to: string;
  path: string;
}

export const TrailMakingTask: React.FC<TrailMakingTaskProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [points] = useState<TrailPoint[]>([
    { id: '1', label: '1', x: 100, y: 80, connected: false, order: 1 },
    { id: 'A', label: 'A', x: 200, y: 150, connected: false, order: 2 },
    { id: '2', label: '2', x: 300, y: 100, connected: false, order: 3 },
    { id: 'B', label: 'B', x: 400, y: 180, connected: false, order: 4 },
    { id: '3', label: '3', x: 350, y: 250, connected: false, order: 5 },
    { id: 'C', label: 'C', x: 250, y: 300, connected: false, order: 6 },
    { id: '4', label: '4', x: 150, y: 280, connected: false, order: 7 },
    { id: 'D', label: 'D', x: 80, y: 200, connected: false, order: 8 },
    { id: '5', label: '5', x: 50, y: 120, connected: false, order: 9 }
  ]);
  
  const [connections, setConnections] = useState<TrailConnection[]>([]);
  const [currentPoint, setCurrentPoint] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errors, setErrors] = useState<number>(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [showResetAlert, setShowResetAlert] = useState(false);

  // Expected sequence: 1-A-2-B-3-C-4-D-5
  const expectedSequence = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5'];

  useEffect(() => {
    if (value) {
      setConnections(value.connections || []);
      setErrors(value.errors || 0);
      setCompleted(value.completed || false);
    }
  }, [value]);

  const updateValue = useCallback((updates: any) => {
    const newValue = {
      connections,
      errors,
      completed,
      completionTime: completed ? Date.now() - startTime : 0,
      ...updates
    };
    onChange(newValue);
  }, [connections, errors, completed, startTime, onChange]);

  const getNextExpectedPoint = useCallback(() => {
    const connectedPoints = connections.map(conn => conn.from);
    if (connectedPoints.length === 0) return '1';
    
    const lastConnected = connections[connections.length - 1]?.to;
    const currentIndex = expectedSequence.indexOf(lastConnected);
    
    if (currentIndex >= 0 && currentIndex < expectedSequence.length - 1) {
      return expectedSequence[currentIndex + 1];
    }
    
    return null;
  }, [connections]);

  const handlePointClick = useCallback((pointId: string) => {
    if (disabled || completed) return;

    const expectedNext = getNextExpectedPoint();
    
    if (!currentPoint) {
      // Starting a new connection
      if (pointId === expectedNext) {
        setCurrentPoint(pointId);
        setIsDrawing(true);
      } else {
        // Wrong starting point
        setErrors(prev => {
          const newErrors = prev + 1;
          updateValue({ errors: newErrors });
          return newErrors;
        });
      }
    } else {
      // Completing a connection
      if (pointId === expectedNext) {
        const newConnection: TrailConnection = {
          from: currentPoint,
          to: pointId,
          path: createPath(currentPoint, pointId)
        };
        
        const newConnections = [...connections, newConnection];
        setConnections(newConnections);
        
        // Check if completed
        const isComplete = newConnections.length === expectedSequence.length - 1;
        setCompleted(isComplete);
        
        updateValue({
          connections: newConnections,
          completed: isComplete,
          completionTime: isComplete ? Date.now() - startTime : 0
        });
        
        setCurrentPoint(null);
        setIsDrawing(false);
      } else {
        // Wrong connection
        setErrors(prev => {
          const newErrors = prev + 1;
          updateValue({ errors: newErrors });
          return newErrors;
        });
        setCurrentPoint(null);
        setIsDrawing(false);
      }
    }
  }, [disabled, completed, currentPoint, connections, getNextExpectedPoint, updateValue, startTime]);

  const createPath = useCallback((fromId: string, toId: string): string => {
    const fromPoint = points.find(p => p.id === fromId);
    const toPoint = points.find(p => p.id === toId);
    
    if (!fromPoint || !toPoint) return '';
    
    return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
  }, [points]);

  const resetTask = useCallback(() => {
    setConnections([]);
    setCurrentPoint(null);
    setIsDrawing(false);
    setErrors(0);
    setCompleted(false);
    updateValue({
      connections: [],
      errors: 0,
      completed: false,
      completionTime: 0
    });
    setShowResetAlert(false);
  }, [updateValue]);

  const isPointConnected = useCallback((pointId: string) => {
    return connections.some(conn => conn.from === pointId || conn.to === pointId);
  }, [connections]);

  const getPointStatus = useCallback((pointId: string) => {
    if (completed) return 'completed';
    if (currentPoint === pointId) return 'current';
    if (isPointConnected(pointId)) return 'connected';
    if (pointId === getNextExpectedPoint()) return 'next';
    return 'inactive';
  }, [completed, currentPoint, isPointConnected, getNextExpectedPoint]);

  return (
    <IonCard className="trail-making-task">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={informationCircle} /> {t('moca.tasks.trailMaking.title')}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <div className="task-instructions">
          <IonText>
            <p>{t('moca.instructions.trailMaking')}</p>
            <p><strong>{t('moca.tasks.trailMaking.instruction')}</strong></p>
          </IonText>
        </div>

        <div className="trail-canvas-container">
          <svg
            ref={svgRef}
            className="trail-canvas"
            viewBox="0 0 500 350"
            width="100%"
            height="350"
          >
            {/* Draw connections */}
            {connections.map((connection, index) => (
              <path
                key={index}
                d={connection.path}
                stroke="#007bff"
                strokeWidth="3"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            ))}
            
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#007bff"
                />
              </marker>
            </defs>

            {/* Draw points */}
            {points.map((point) => {
              const status = getPointStatus(point.id);
              return (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="25"
                    className={`trail-point trail-point-${status}`}
                    onClick={() => handlePointClick(point.id)}
                    style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                  />
                  <text
                    x={point.x}
                    y={point.y + 5}
                    textAnchor="middle"
                    className="trail-point-label"
                    onClick={() => handlePointClick(point.id)}
                    style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="task-status">
          <div className="status-info">
            <IonText color="medium">
              <p>
                Conexiones: {connections.length}/{expectedSequence.length - 1} | 
                Errores: {errors} | 
                {completed && ` Tiempo: ${Math.round((value?.completionTime || 0) / 1000)}s`}
              </p>
            </IonText>
          </div>

          {completed && (
            <div className="completion-message">
              <IonText color="success">
                <p>
                  <IonIcon icon={checkmark} /> ¡Tarea completada!
                </p>
              </IonText>
            </div>
          )}
        </div>

        <div className="task-controls">
          <IonButton
            fill="outline"
            onClick={() => setShowResetAlert(true)}
            disabled={disabled || (connections.length === 0 && errors === 0)}
          >
            <IonIcon icon={refresh} slot="start" />
            Reiniciar
          </IonButton>
        </div>

        {/* Reset confirmation alert */}
        <IonAlert
          isOpen={showResetAlert}
          onDidDismiss={() => setShowResetAlert(false)}
          header="Reiniciar Tarea"
          message="¿Está seguro de que quiere reiniciar la tarea? Se perderá todo el progreso."
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Reiniciar',
              handler: resetTask
            }
          ]}
        />
      </IonCardContent>
    </IonCard>
  );
};