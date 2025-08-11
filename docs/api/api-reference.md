# Referencia de API - NeuralHack Cognitive AI

## Información General

### Base URL
```
Producción: https://api.neuralhack.com/v1
Staging: https://staging-api.neuralhack.com/v1
Desarrollo: http://localhost:3000/api/v1
```

### Autenticación
Todas las APIs requieren autenticación JWT excepto las rutas públicas.

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Versionado
- **Versión Actual**: v1
- **Formato**: `/api/v{version}/endpoint`
- **Compatibilidad**: Backward compatible por 12 meses

### Rate Limiting
- **Límite**: 1000 requests/hora por usuario
- **Headers de Respuesta**:
  ```http
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  ```

## Endpoints de Autenticación

### POST /auth/register
Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura",
  "dateOfBirth": "1980-01-01",
  "educationLevel": 12,
  "language": "es",
  "consentGiven": true
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "dateOfBirth": "1980-01-01",
    "educationLevel": 12,
    "language": "es",
    "createdAt": "2024-12-08T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 900
  }
}
```

**Errores:**
- `400`: Datos de entrada inválidos
- `409`: Email ya registrado
- `422`: Validación fallida

### POST /auth/login
Autentica un usuario existente.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "lastLoginAt": "2024-12-08T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 900
  }
}
```

### POST /auth/refresh
Renueva un token de acceso usando el refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token"
}
```

**Response (200):**
```json
{
  "access_token": "new_jwt_token",
  "expires_in": 900
}
```

### POST /auth/logout
Cierra la sesión del usuario.

**Response (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

## Endpoints de Evaluaciones

### GET /assessments/types
Obtiene los tipos de evaluaciones disponibles.

**Response (200):**
```json
{
  "assessmentTypes": [
    {
      "id": "moca",
      "name": "Montreal Cognitive Assessment",
      "description": "Evaluación cognitiva breve para detección de deterioro cognitivo leve",
      "duration": "10-15 minutos",
      "language": "es",
      "version": "7.1"
    },
    {
      "id": "phq9",
      "name": "Patient Health Questionnaire-9",
      "description": "Cuestionario para evaluación de síntomas depresivos",
      "duration": "5 minutos",
      "language": "es",
      "version": "1.0"
    }
  ]
}
```

### POST /assessments/sessions
Crea una nueva sesión de evaluación.

**Request Body:**
```json
{
  "assessmentType": "moca",
  "metadata": {
    "deviceType": "mobile",
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "375x667"
  }
}
```

**Response (201):**
```json
{
  "session": {
    "id": "session_uuid",
    "assessmentType": "moca",
    "status": "in_progress",
    "startedAt": "2024-12-08T10:00:00Z",
    "expiresAt": "2024-12-08T11:00:00Z"
  }
}
```

### GET /assessments/sessions/{sessionId}
Obtiene el estado de una sesión de evaluación.

**Response (200):**
```json
{
  "session": {
    "id": "session_uuid",
    "assessmentType": "moca",
    "status": "in_progress",
    "startedAt": "2024-12-08T10:00:00Z",
    "currentQuestion": 5,
    "totalQuestions": 30,
    "responses": [
      {
        "questionId": "q1",
        "answer": "correct_answer",
        "timestamp": "2024-12-08T10:01:00Z",
        "responseTime": 2500
      }
    ]
  }
}
```

### POST /assessments/sessions/{sessionId}/responses
Envía una respuesta a una pregunta de evaluación.

**Request Body:**
```json
{
  "questionId": "q1",
  "answer": "selected_option",
  "responseTime": 2500,
  "metadata": {
    "attempts": 1,
    "confidence": "high"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "nextQuestion": {
    "id": "q2",
    "type": "multiple_choice",
    "question": "¿Cuál es la fecha de hoy?",
    "options": ["Opción A", "Opción B", "Opción C"],
    "instructions": "Seleccione la respuesta correcta"
  }
}
```

### POST /assessments/sessions/{sessionId}/complete
Completa una sesión de evaluación y calcula resultados.

**Response (200):**
```json
{
  "result": {
    "sessionId": "session_uuid",
    "assessmentType": "moca",
    "completedAt": "2024-12-08T10:15:00Z",
    "scores": {
      "rawScore": 26,
      "adjustedScore": 27,
      "maxScore": 30
    },
    "riskAssessment": {
      "riskPercentage": 15,
      "riskCategory": "low",
      "confidenceInterval": [10, 20]
    },
    "recommendations": [
      {
        "type": "lifestyle",
        "priority": "high",
        "title": "Mantener actividad física regular",
        "description": "Realizar ejercicio moderado 30 minutos al día"
      }
    ]
  }
}
```

## Endpoints de Resultados

### GET /results
Obtiene el historial de resultados del usuario.

**Query Parameters:**
- `limit`: Número de resultados (default: 10, max: 100)
- `offset`: Offset para paginación (default: 0)
- `assessmentType`: Filtrar por tipo de evaluación
- `dateFrom`: Fecha de inicio (ISO 8601)
- `dateTo`: Fecha de fin (ISO 8601)

**Response (200):**
```json
{
  "results": [
    {
      "id": "result_uuid",
      "assessmentType": "moca",
      "completedAt": "2024-12-08T10:15:00Z",
      "scores": {
        "rawScore": 26,
        "adjustedScore": 27,
        "maxScore": 30
      },
      "riskAssessment": {
        "riskPercentage": 15,
        "riskCategory": "low"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /results/{resultId}
Obtiene un resultado específico con detalles completos.

**Response (200):**
```json
{
  "result": {
    "id": "result_uuid",
    "sessionId": "session_uuid",
    "assessmentType": "moca",
    "completedAt": "2024-12-08T10:15:00Z",
    "duration": 900,
    "scores": {
      "rawScore": 26,
      "adjustedScore": 27,
      "maxScore": 30,
      "subscores": {
        "memory": 4,
        "attention": 5,
        "language": 6,
        "visuospatial": 4,
        "executive": 4,
        "orientation": 6
      }
    },
    "riskAssessment": {
      "riskPercentage": 15,
      "riskCategory": "low",
      "confidenceInterval": [10, 20],
      "factors": [
        {
          "name": "age",
          "value": 45,
          "impact": "neutral"
        },
        {
          "name": "education",
          "value": 16,
          "impact": "protective"
        }
      ]
    },
    "recommendations": [
      {
        "id": "rec_1",
        "type": "lifestyle",
        "priority": "high",
        "title": "Mantener actividad física regular",
        "description": "Realizar ejercicio moderado 30 minutos al día",
        "evidence": "Estudios muestran que el ejercicio reduce el riesgo de deterioro cognitivo en 30%",
        "resources": [
          {
            "title": "Guía de ejercicios para adultos mayores",
            "url": "https://neuralhack.com/resources/exercise-guide"
          }
        ]
      }
    ],
    "metadata": {
      "deviceType": "mobile",
      "completionRate": 100,
      "averageResponseTime": 2800
    }
  }
}
```

### GET /results/trends
Obtiene tendencias longitudinales de los resultados del usuario.

**Query Parameters:**
- `assessmentType`: Tipo de evaluación (requerido)
- `period`: Período de análisis (3m, 6m, 1y, all)

**Response (200):**
```json
{
  "trends": {
    "assessmentType": "moca",
    "period": "6m",
    "dataPoints": [
      {
        "date": "2024-06-08",
        "score": 25,
        "riskPercentage": 20
      },
      {
        "date": "2024-09-08",
        "score": 26,
        "riskPercentage": 15
      },
      {
        "date": "2024-12-08",
        "score": 27,
        "riskPercentage": 10
      }
    ],
    "analysis": {
      "trend": "improving",
      "changePercentage": 8,
      "significantChange": false,
      "alerts": []
    }
  }
}
```

## Endpoints de Exportación

### POST /export/results
Genera un archivo de exportación de resultados.

**Request Body:**
```json
{
  "format": "pdf",
  "includeDetails": true,
  "assessmentTypes": ["moca", "phq9"],
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  },
  "language": "es"
}
```

**Response (202):**
```json
{
  "exportId": "export_uuid",
  "status": "processing",
  "estimatedCompletion": "2024-12-08T10:05:00Z"
}
```

### GET /export/{exportId}/status
Verifica el estado de una exportación.

**Response (200):**
```json
{
  "exportId": "export_uuid",
  "status": "completed",
  "downloadUrl": "https://secure.neuralhack.com/downloads/export_uuid.pdf",
  "expiresAt": "2024-12-09T10:00:00Z",
  "fileSize": 2048576
}
```

### GET /export/{exportId}/download
Descarga el archivo de exportación.

**Response (200):**
- Content-Type: application/pdf o application/zip
- Content-Disposition: attachment; filename="resultados_2024.pdf"

## Endpoints de Usuario

### GET /users/profile
Obtiene el perfil del usuario actual.

**Response (200):**
```json
{
  "profile": {
    "id": "user_uuid",
    "email": "usuario@ejemplo.com",
    "dateOfBirth": "1980-01-01",
    "educationLevel": 12,
    "language": "es",
    "accessibilitySettings": {
      "fontSize": "large",
      "highContrast": false,
      "voiceGuidance": true
    },
    "consentGiven": true,
    "consentDate": "2024-12-08T10:00:00Z",
    "createdAt": "2024-12-08T10:00:00Z",
    "updatedAt": "2024-12-08T10:00:00Z"
  }
}
```

### PUT /users/profile
Actualiza el perfil del usuario.

**Request Body:**
```json
{
  "educationLevel": 16,
  "accessibilitySettings": {
    "fontSize": "extra-large",
    "highContrast": true,
    "voiceGuidance": true
  }
}
```

**Response (200):**
```json
{
  "profile": {
    "id": "user_uuid",
    "educationLevel": 16,
    "accessibilitySettings": {
      "fontSize": "extra-large",
      "highContrast": true,
      "voiceGuidance": true
    },
    "updatedAt": "2024-12-08T11:00:00Z"
  }
}
```

### DELETE /users/profile
Elimina la cuenta del usuario (GDPR Right to be Forgotten).

**Response (200):**
```json
{
  "message": "Cuenta eliminada exitosamente",
  "deletedAt": "2024-12-08T11:00:00Z",
  "dataRetentionPeriod": "30 días"
}
```

## Códigos de Estado HTTP

### Códigos de Éxito
- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `202 Accepted`: Solicitud aceptada para procesamiento
- `204 No Content`: Solicitud exitosa sin contenido de respuesta

### Códigos de Error del Cliente
- `400 Bad Request`: Solicitud malformada
- `401 Unauthorized`: Autenticación requerida
- `403 Forbidden`: Acceso denegado
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto con el estado actual
- `422 Unprocessable Entity`: Errores de validación
- `429 Too Many Requests`: Rate limit excedido

### Códigos de Error del Servidor
- `500 Internal Server Error`: Error interno del servidor
- `502 Bad Gateway`: Error de gateway
- `503 Service Unavailable`: Servicio no disponible
- `504 Gateway Timeout`: Timeout de gateway

## Formato de Errores

Todos los errores siguen un formato consistente:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": [
      {
        "field": "email",
        "message": "El formato del email no es válido"
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres"
      }
    ],
    "timestamp": "2024-12-08T10:00:00Z",
    "requestId": "req_uuid"
  }
}
```

## Webhooks

### Configuración de Webhooks
Los webhooks permiten recibir notificaciones en tiempo real sobre eventos importantes.

**Endpoint de Configuración:** `POST /webhooks`

**Request Body:**
```json
{
  "url": "https://tu-servidor.com/webhook",
  "events": ["assessment.completed", "user.registered"],
  "secret": "webhook_secret"
}
```

### Eventos Disponibles
- `assessment.completed`: Evaluación completada
- `user.registered`: Usuario registrado
- `export.ready`: Exportación lista para descarga
- `alert.triggered`: Alerta de cambio significativo

### Formato de Payload
```json
{
  "event": "assessment.completed",
  "timestamp": "2024-12-08T10:15:00Z",
  "data": {
    "userId": "user_uuid",
    "sessionId": "session_uuid",
    "assessmentType": "moca",
    "riskCategory": "low"
  },
  "signature": "sha256=hash_signature"
}
```

## Límites y Cuotas

### Límites por Endpoint
- **Autenticación**: 10 intentos/minuto
- **Evaluaciones**: 5 sesiones simultáneas
- **Exportación**: 3 exportaciones/día
- **API General**: 1000 requests/hora

### Tamaños de Payload
- **Request Body**: Máximo 10MB
- **File Upload**: Máximo 50MB
- **Export File**: Máximo 100MB

## Versionado y Deprecación

### Política de Versionado
- **Cambios Menores**: Backward compatible
- **Cambios Mayores**: Nueva versión de API
- **Deprecación**: Aviso de 6 meses

### Migración entre Versiones
- **Período de Transición**: 12 meses
- **Documentación**: Guías de migración disponibles
- **Soporte**: Asistencia técnica durante migración

---

**Documento**: Referencia de API v1.0  
**Fecha**: Diciembre 2024  
**Autor**: Equipo de Backend NeuralHack  
**Revisión**: Pendiente  
**Próxima Actualización**: Enero 2025