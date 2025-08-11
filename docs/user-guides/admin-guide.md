# Guía de Administrador - NeuralHack Cognitive AI

## Resumen Ejecutivo

Esta guía proporciona instrucciones completas para administradores del sistema NeuralHack Cognitive AI, incluyendo configuración, monitoreo, mantenimiento y resolución de problemas.

## Tabla de Contenidos

1. [Acceso Administrativo](#acceso-administrativo)
2. [Panel de Administración](#panel-de-administración)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Configuración del Sistema](#configuración-del-sistema)
5. [Monitoreo y Métricas](#monitoreo-y-métricas)
6. [Gestión de Datos](#gestión-de-datos)
7. [Seguridad y Compliance](#seguridad-y-compliance)
8. [Backup y Recuperación](#backup-y-recuperación)
9. [Mantenimiento del Sistema](#mantenimiento-del-sistema)
10. [Resolución de Problemas](#resolución-de-problemas)

## Acceso Administrativo

### Roles de Administrador

#### Super Administrador
- **Permisos**: Acceso completo al sistema
- **Responsabilidades**: Configuración global, gestión de otros administradores
- **Acceso**: Panel completo de administración

#### Administrador de Sistema
- **Permisos**: Configuración técnica, monitoreo
- **Responsabilidades**: Mantenimiento, actualizaciones, rendimiento
- **Acceso**: Configuración del sistema, métricas técnicas

#### Administrador de Datos
- **Permisos**: Gestión de datos, backup, compliance
- **Responsabilidades**: Integridad de datos, cumplimiento regulatorio
- **Acceso**: Gestión de datos, reportes de compliance

#### Administrador de Soporte
- **Permisos**: Soporte a usuarios, logs básicos
- **Responsabilidades**: Atención al usuario, resolución de problemas básicos
- **Acceso**: Panel de soporte, logs de usuario

### Autenticación de Administradores

#### Requisitos de Seguridad
- **MFA Obligatorio**: Autenticación de dos factores requerida
- **Contraseñas Fuertes**: Mínimo 12 caracteres, complejidad alta
- **Rotación**: Cambio obligatorio cada 90 días
- **Sesiones**: Timeout automático después de 30 minutos de inactividad

#### Proceso de Login
```bash
# Acceso al panel de administración
https://admin.neuralhack.com/login

# Credenciales requeridas:
- Email administrativo
- Contraseña
- Código MFA (SMS/App)
- Justificación de acceso (para auditoría)
```

## Panel de Administración

### Dashboard Principal

#### Métricas Clave
- **Usuarios Activos**: Usuarios únicos en las últimas 24 horas
- **Evaluaciones Completadas**: Total de evaluaciones finalizadas hoy
- **Tiempo de Respuesta**: Latencia promedio de la API
- **Disponibilidad del Sistema**: Uptime en las últimas 24 horas
- **Alertas Activas**: Número de alertas críticas pendientes

#### Widgets Disponibles
```typescript
interface AdminDashboardWidget {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'alert'
  refreshInterval: number // segundos
  permissions: string[]
  configuration: {
    dataSource: string
    filters: Record<string, any>
    visualization: 'line' | 'bar' | 'pie' | 'number'
  }
}

// Ejemplos de widgets
const dashboardWidgets: AdminDashboardWidget[] = [
  {
    id: 'active-users',
    title: 'Usuarios Activos',
    type: 'metric',
    refreshInterval: 300,
    permissions: ['admin', 'system_admin'],
    configuration: {
      dataSource: 'user_analytics',
      filters: { timeRange: '24h' },
      visualization: 'number'
    }
  },
  {
    id: 'system-performance',
    title: 'Rendimiento del Sistema',
    type: 'chart',
    refreshInterval: 60,
    permissions: ['admin', 'system_admin'],
    configuration: {
      dataSource: 'system_metrics',
      filters: { metrics: ['cpu', 'memory', 'disk'] },
      visualization: 'line'
    }
  }
]
```

### Navegación del Panel

#### Menú Principal
- **Dashboard**: Vista general del sistema
- **Usuarios**: Gestión de cuentas de usuario
- **Evaluaciones**: Administración de pruebas cognitivas
- **Datos**: Gestión y análisis de datos
- **Sistema**: Configuración técnica
- **Seguridad**: Logs de auditoría y configuración de seguridad
- **Reportes**: Generación de reportes y analytics
- **Configuración**: Ajustes globales del sistema

## Gestión de Usuarios

### Administración de Cuentas

#### Crear Usuario Administrativo
```bash
# Acceder al panel de usuarios
Admin Panel > Usuarios > Crear Nuevo Usuario

# Información requerida:
- Email: admin@neuralhack.com
- Nombre completo: Juan Pérez
- Rol: system_admin
- Permisos específicos: [user_management, system_config]
- Fecha de expiración: 2025-12-31
- Requiere cambio de contraseña: Sí
```

#### Gestión de Roles y Permisos
```typescript
interface UserRole {
  id: string
  name: string
  description: string
  permissions: Permission[]
  inheritsFrom?: string[]
  isActive: boolean
}

interface Permission {
  resource: string // 'users', 'assessments', 'system'
  actions: ('create' | 'read' | 'update' | 'delete')[]
  conditions?: {
    field: string
    operator: 'equals' | 'in' | 'contains'
    value: any
  }[]
}

// Ejemplo de configuración de rol
const systemAdminRole: UserRole = {
  id: 'system_admin',
  name: 'Administrador de Sistema',
  description: 'Acceso completo a configuración del sistema',
  permissions: [
    {
      resource: 'system',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'users',
      actions: ['read', 'update'],
      conditions: [
        { field: 'role', operator: 'in', value: ['user', 'support'] }
      ]
    }
  ],
  isActive: true
}
```

### Monitoreo de Usuarios

#### Métricas de Usuario
- **Usuarios Registrados**: Total de cuentas creadas
- **Usuarios Activos**: Usuarios con actividad en los últimos 30 días
- **Tasa de Retención**: Porcentaje de usuarios que regresan
- **Evaluaciones por Usuario**: Promedio de evaluaciones completadas
- **Tiempo de Sesión**: Duración promedio de sesiones

#### Análisis de Comportamiento
```sql
-- Consulta para análisis de usuarios activos
SELECT 
  DATE(created_at) as fecha_registro,
  COUNT(*) as nuevos_usuarios,
  COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as usuarios_activos
FROM profiles 
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY fecha_registro DESC;

-- Consulta para evaluaciones por usuario
SELECT 
  p.id,
  p.email,
  COUNT(ar.id) as total_evaluaciones,
  MAX(ar.completed_at) as ultima_evaluacion,
  AVG(ar.duration) as duracion_promedio
FROM profiles p
LEFT JOIN assessment_sessions ar ON p.id = ar.user_id
WHERE ar.status = 'completed'
GROUP BY p.id, p.email
HAVING COUNT(ar.id) > 0
ORDER BY total_evaluaciones DESC;
```

## Configuración del Sistema

### Configuración de la Aplicación

#### Variables de Entorno
```bash
# Configuración de base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/neuralhack
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Configuración de autenticación
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# Configuración de almacenamiento
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Configuración de email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@neuralhack.com
SMTP_PASS=your-app-password

# Configuración de monitoreo
MONITORING_ENABLED=true
LOG_LEVEL=info
METRICS_ENDPOINT=/metrics
```

#### Configuración de Evaluaciones
```typescript
interface AssessmentConfiguration {
  moca: {
    timeLimit: number // minutos
    educationAdjustment: boolean
    scoringRules: ScoringRule[]
    accessibilityFeatures: string[]
  }
  phq9: {
    timeLimit: number
    requiredQuestions: number[]
    scoringThresholds: {
      minimal: [0, 4]
      mild: [5, 9]
      moderate: [10, 14]
      moderatelySevere: [15, 19]
      severe: [20, 27]
    }
  }
  general: {
    maxConcurrentSessions: number
    sessionTimeout: number // minutos
    autoSave: boolean
    autoSaveInterval: number // segundos
  }
}

// Actualizar configuración
const updateAssessmentConfig = async (config: AssessmentConfiguration) => {
  await supabase
    .from('system_configuration')
    .upsert({
      key: 'assessment_config',
      value: config,
      updated_at: new Date()
    })
}
```

### Configuración de Seguridad

#### Políticas de Contraseña
```typescript
interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventReuse: number // últimas N contraseñas
  maxAge: number // días
  lockoutThreshold: number // intentos fallidos
  lockoutDuration: number // minutos
}

const passwordPolicy: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: 5,
  maxAge: 90,
  lockoutThreshold: 5,
  lockoutDuration: 30
}
```

#### Configuración de Auditoría
```typescript
interface AuditConfiguration {
  enabledEvents: string[]
  retentionPeriod: number // días
  realTimeAlerts: boolean
  exportFormat: 'json' | 'csv' | 'xml'
  encryptLogs: boolean
  immutableStorage: boolean
}

const auditConfig: AuditConfiguration = {
  enabledEvents: [
    'user_login',
    'user_logout',
    'data_access',
    'data_modification',
    'admin_action',
    'system_configuration_change'
  ],
  retentionPeriod: 2555, // 7 años
  realTimeAlerts: true,
  exportFormat: 'json',
  encryptLogs: true,
  immutableStorage: true
}
```

## Monitoreo y Métricas

### Métricas del Sistema

#### Métricas de Rendimiento
```typescript
interface SystemMetrics {
  cpu: {
    usage: number // porcentaje
    loadAverage: number[]
    cores: number
  }
  memory: {
    used: number // bytes
    available: number // bytes
    percentage: number
  }
  disk: {
    used: number // bytes
    available: number // bytes
    percentage: number
    iops: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
    errors: number
  }
}

// Recolección de métricas
class SystemMonitoring {
  async collectMetrics(): Promise<SystemMetrics> {
    return {
      cpu: await this.getCPUMetrics(),
      memory: await this.getMemoryMetrics(),
      disk: await this.getDiskMetrics(),
      network: await this.getNetworkMetrics()
    }
  }
  
  async getCPUMetrics(): Promise<SystemMetrics['cpu']> {
    const cpus = os.cpus()
    const loadAvg = os.loadavg()
    
    // Calcular uso de CPU
    let totalIdle = 0
    let totalTick = 0
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type]
      }
      totalIdle += cpu.times.idle
    })
    
    const usage = 100 - (totalIdle / totalTick * 100)
    
    return {
      usage: Math.round(usage * 100) / 100,
      loadAverage: loadAvg,
      cores: cpus.length
    }
  }
}
```

#### Métricas de Aplicación
```typescript
interface ApplicationMetrics {
  requests: {
    total: number
    successful: number
    failed: number
    averageResponseTime: number
    p95ResponseTime: number
    p99ResponseTime: number
  }
  assessments: {
    started: number
    completed: number
    abandoned: number
    averageDuration: number
  }
  users: {
    active: number
    new: number
    returning: number
    averageSessionDuration: number
  }
  errors: {
    total: number
    byType: Record<string, number>
    byEndpoint: Record<string, number>
  }
}
```

### Alertas y Notificaciones

#### Configuración de Alertas
```typescript
interface AlertRule {
  id: string
  name: string
  description: string
  metric: string
  condition: {
    operator: '>' | '<' | '=' | '>=' | '<='
    threshold: number
    duration: number // segundos
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  notifications: {
    email: string[]
    sms: string[]
    slack: string[]
    webhook: string[]
  }
  autoRemediation?: {
    enabled: boolean
    actions: string[]
  }
}

// Ejemplos de reglas de alerta
const alertRules: AlertRule[] = [
  {
    id: 'high-cpu-usage',
    name: 'Uso Alto de CPU',
    description: 'CPU usage above 80% for more than 5 minutes',
    metric: 'system.cpu.usage',
    condition: {
      operator: '>',
      threshold: 80,
      duration: 300
    },
    severity: 'high',
    notifications: {
      email: ['admin@neuralhack.com'],
      sms: ['+525512345678'],
      slack: ['#alerts'],
      webhook: []
    },
    autoRemediation: {
      enabled: true,
      actions: ['scale_up', 'restart_services']
    }
  },
  {
    id: 'assessment-failure-rate',
    name: 'Alta Tasa de Fallas en Evaluaciones',
    description: 'Assessment failure rate above 5%',
    metric: 'assessments.failure_rate',
    condition: {
      operator: '>',
      threshold: 5,
      duration: 600
    },
    severity: 'medium',
    notifications: {
      email: ['support@neuralhack.com'],
      sms: [],
      slack: ['#support'],
      webhook: []
    }
  }
]
```

## Gestión de Datos

### Administración de Base de Datos

#### Consultas Administrativas Comunes
```sql
-- Estadísticas generales de usuarios
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as activos_30d,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as nuevos_7d
FROM profiles;

-- Estadísticas de evaluaciones por tipo
SELECT 
  test_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as duracion_promedio_min
FROM assessment_sessions 
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY test_type;

-- Usuarios con mayor actividad
SELECT 
  p.email,
  COUNT(a.id) as evaluaciones_completadas,
  MAX(a.completed_at) as ultima_evaluacion,
  MIN(a.completed_at) as primera_evaluacion
FROM profiles p
JOIN assessment_sessions a ON p.id = a.user_id
WHERE a.status = 'completed'
GROUP BY p.id, p.email
ORDER BY evaluaciones_completadas DESC
LIMIT 20;

-- Detección de anomalías en datos
SELECT 
  user_id,
  test_type,
  COUNT(*) as evaluaciones_mismo_dia,
  DATE(completed_at) as fecha
FROM assessment_sessions 
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, test_type, DATE(completed_at)
HAVING COUNT(*) > 5  -- Más de 5 evaluaciones del mismo tipo en un día
ORDER BY evaluaciones_mismo_dia DESC;
```

#### Mantenimiento de Base de Datos
```sql
-- Limpieza de sesiones abandonadas (más de 24 horas)
DELETE FROM assessment_sessions 
WHERE status = 'in_progress' 
  AND started_at < NOW() - INTERVAL '24 hours';

-- Actualizar estadísticas de tablas
ANALYZE profiles;
ANALYZE assessment_sessions;
ANALYZE audit_logs;

-- Verificar integridad referencial
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = conname
  );

-- Monitoreo de espacio en disco
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Exportación de Datos

#### Exportación Masiva
```bash
#!/bin/bash
# Script para exportación masiva de datos

# Configuración
BACKUP_DIR="/var/backups/neuralhack"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="neuralhack"

# Crear directorio de backup
mkdir -p $BACKUP_DIR/$DATE

# Exportar datos de usuarios (sin PII)
psql -d $DB_NAME -c "
COPY (
  SELECT 
    id,
    date_of_birth,
    education_level,
    language,
    created_at
  FROM profiles
) TO '$BACKUP_DIR/$DATE/users_anonymized.csv' WITH CSV HEADER;
"

# Exportar resultados de evaluaciones
psql -d $DB_NAME -c "
COPY (
  SELECT 
    user_id,
    test_type,
    started_at,
    completed_at,
    status,
    result
  FROM assessment_sessions
  WHERE status = 'completed'
) TO '$BACKUP_DIR/$DATE/assessments.csv' WITH CSV HEADER;
"

# Comprimir archivos
tar -czf $BACKUP_DIR/export_$DATE.tar.gz -C $BACKUP_DIR/$DATE .

# Limpiar archivos temporales
rm -rf $BACKUP_DIR/$DATE

echo "Exportación completada: $BACKUP_DIR/export_$DATE.tar.gz"
```

## Seguridad y Compliance

### Auditoría de Seguridad

#### Logs de Auditoría
```sql
-- Consultar intentos de login fallidos
SELECT 
  user_id,
  ip_address,
  user_agent,
  COUNT(*) as intentos_fallidos,
  MAX(created_at) as ultimo_intento
FROM audit_logs 
WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, ip_address, user_agent
HAVING COUNT(*) >= 3
ORDER BY intentos_fallidos DESC;

-- Accesos administrativos recientes
SELECT 
  al.user_id,
  p.email,
  al.action,
  al.resource_type,
  al.ip_address,
  al.created_at
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.action LIKE 'admin_%'
  AND al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

-- Exportaciones de datos
SELECT 
  al.user_id,
  p.email,
  al.metadata->>'export_type' as tipo_exportacion,
  al.metadata->>'record_count' as registros_exportados,
  al.created_at
FROM audit_logs al
JOIN profiles p ON al.user_id = p.id
WHERE al.action = 'data_export'
  AND al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;
```

#### Verificación de Compliance
```typescript
class ComplianceChecker {
  async runComplianceCheck(): Promise<ComplianceReport> {
    const checks = [
      this.checkDataRetention(),
      this.checkEncryption(),
      this.checkAccessControls(),
      this.checkAuditLogs(),
      this.checkBackupProcedures()
    ]
    
    const results = await Promise.all(checks)
    
    return {
      timestamp: new Date(),
      overallStatus: results.every(r => r.passed) ? 'compliant' : 'non_compliant',
      checks: results,
      recommendations: this.generateRecommendations(results)
    }
  }
  
  private async checkDataRetention(): Promise<ComplianceCheck> {
    // Verificar que los datos se retengan según las políticas
    const oldData = await this.findDataBeyondRetention()
    
    return {
      name: 'Data Retention',
      passed: oldData.length === 0,
      details: `Found ${oldData.length} records beyond retention period`,
      remediation: oldData.length > 0 ? 'Archive or delete old data' : null
    }
  }
  
  private async checkEncryption(): Promise<ComplianceCheck> {
    // Verificar que todos los datos PII estén encriptados
    const unencryptedData = await this.findUnencryptedPII()
    
    return {
      name: 'Data Encryption',
      passed: unencryptedData.length === 0,
      details: `Found ${unencryptedData.length} unencrypted PII records`,
      remediation: unencryptedData.length > 0 ? 'Encrypt all PII data' : null
    }
  }
}
```

## Backup y Recuperación

### Administración de Backups

#### Verificación de Backups
```bash
#!/bin/bash
# Script de verificación de backups

BACKUP_DIR="/var/backups/neuralhack"
LOG_FILE="/var/log/backup_verification.log"

echo "$(date): Iniciando verificación de backups" >> $LOG_FILE

# Verificar backup más reciente
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "$(date): ERROR - No se encontraron backups" >> $LOG_FILE
    exit 1
fi

# Verificar integridad del archivo
if gzip -t "$LATEST_BACKUP"; then
    echo "$(date): OK - Backup íntegro: $LATEST_BACKUP" >> $LOG_FILE
else
    echo "$(date): ERROR - Backup corrupto: $LATEST_BACKUP" >> $LOG_FILE
    exit 1
fi

# Verificar tamaño del backup
BACKUP_SIZE=$(stat -f%z "$LATEST_BACKUP" 2>/dev/null || stat -c%s "$LATEST_BACKUP")
MIN_SIZE=1048576  # 1MB mínimo

if [ "$BACKUP_SIZE" -lt "$MIN_SIZE" ]; then
    echo "$(date): WARNING - Backup muy pequeño: $BACKUP_SIZE bytes" >> $LOG_FILE
fi

# Verificar edad del backup
BACKUP_AGE=$(( $(date +%s) - $(stat -f%m "$LATEST_BACKUP" 2>/dev/null || stat -c%Y "$LATEST_BACKUP") ))
MAX_AGE=86400  # 24 horas

if [ "$BACKUP_AGE" -gt "$MAX_AGE" ]; then
    echo "$(date): WARNING - Backup muy antiguo: $BACKUP_AGE segundos" >> $LOG_FILE
fi

echo "$(date): Verificación completada exitosamente" >> $LOG_FILE
```

#### Restauración de Datos
```bash
#!/bin/bash
# Script de restauración de emergencia

# Parámetros
BACKUP_FILE=$1
TARGET_DB=$2
RESTORE_TYPE=${3:-full}  # full, partial, schema_only

if [ $# -lt 2 ]; then
    echo "Uso: $0 <backup_file> <target_database> [restore_type]"
    exit 1
fi

echo "Iniciando restauración de $BACKUP_FILE a $TARGET_DB"

# Crear base de datos de destino si no existe
createdb $TARGET_DB 2>/dev/null || true

case $RESTORE_TYPE in
    "full")
        echo "Restauración completa..."
        gunzip -c $BACKUP_FILE | psql -d $TARGET_DB
        ;;
    "schema_only")
        echo "Restauración solo de esquema..."
        gunzip -c $BACKUP_FILE | psql -d $TARGET_DB --schema-only
        ;;
    "partial")
        echo "Restauración parcial (solo datos críticos)..."
        gunzip -c $BACKUP_FILE | grep -E "(profiles|assessment_sessions)" | psql -d $TARGET_DB
        ;;
esac

if [ $? -eq 0 ]; then
    echo "Restauración completada exitosamente"
else
    echo "Error durante la restauración"
    exit 1
fi
```

## Mantenimiento del Sistema

### Tareas de Mantenimiento Rutinario

#### Mantenimiento Diario
```bash
#!/bin/bash
# Script de mantenimiento diario

LOG_FILE="/var/log/daily_maintenance.log"
echo "$(date): Iniciando mantenimiento diario" >> $LOG_FILE

# 1. Limpiar logs antiguos
find /var/log -name "*.log" -mtime +30 -delete
echo "$(date): Logs antiguos eliminados" >> $LOG_FILE

# 2. Limpiar sesiones expiradas
psql -d neuralhack -c "
DELETE FROM assessment_sessions 
WHERE status = 'in_progress' 
  AND started_at < NOW() - INTERVAL '24 hours';
"
echo "$(date): Sesiones expiradas eliminadas" >> $LOG_FILE

# 3. Actualizar estadísticas de base de datos
psql -d neuralhack -c "ANALYZE;"
echo "$(date): Estadísticas de BD actualizadas" >> $LOG_FILE

# 4. Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): WARNING - Uso de disco alto: $DISK_USAGE%" >> $LOG_FILE
    # Enviar alerta
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
         -H 'Content-type: application/json' \
         --data '{"text":"⚠️ Uso de disco alto: '$DISK_USAGE'%"}'
fi

echo "$(date): Mantenimiento diario completado" >> $LOG_FILE
```

#### Mantenimiento Semanal
```bash
#!/bin/bash
# Script de mantenimiento semanal

LOG_FILE="/var/log/weekly_maintenance.log"
echo "$(date): Iniciando mantenimiento semanal" >> $LOG_FILE

# 1. Optimizar base de datos
psql -d neuralhack -c "VACUUM ANALYZE;"
echo "$(date): Base de datos optimizada" >> $LOG_FILE

# 2. Rotar logs de aplicación
logrotate /etc/logrotate.d/neuralhack
echo "$(date): Logs rotados" >> $LOG_FILE

# 3. Verificar certificados SSL
CERT_EXPIRY=$(openssl x509 -in /etc/ssl/certs/neuralhack.crt -noout -enddate | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "$(date): WARNING - Certificado SSL expira en $DAYS_UNTIL_EXPIRY días" >> $LOG_FILE
fi

# 4. Generar reporte de uso
psql -d neuralhack -c "
SELECT 
  'Usuarios totales' as metrica,
  COUNT(*) as valor
FROM profiles
UNION ALL
SELECT 
  'Evaluaciones esta semana',
  COUNT(*)
FROM assessment_sessions 
WHERE completed_at > NOW() - INTERVAL '7 days'
  AND status = 'completed';
" > /tmp/weekly_report.txt

echo "$(date): Reporte semanal generado" >> $LOG_FILE
```

### Actualizaciones del Sistema

#### Proceso de Actualización
```bash
#!/bin/bash
# Script de actualización del sistema

VERSION=$1
ENVIRONMENT=${2:-staging}

if [ -z "$VERSION" ]; then
    echo "Uso: $0 <version> [environment]"
    exit 1
fi

echo "Actualizando a versión $VERSION en entorno $ENVIRONMENT"

# 1. Crear backup pre-actualización
./backup.sh pre-update-$VERSION

# 2. Detener servicios
systemctl stop neuralhack-api
systemctl stop neuralhack-worker

# 3. Descargar nueva versión
wget "https://releases.neuralhack.com/v$VERSION/neuralhack-$VERSION.tar.gz"
tar -xzf neuralhack-$VERSION.tar.gz

# 4. Ejecutar migraciones de base de datos
cd neuralhack-$VERSION
npm run migrate

# 5. Actualizar archivos de aplicación
rsync -av --delete ./ /opt/neuralhack/

# 6. Instalar dependencias
cd /opt/neuralhack
npm ci --production

# 7. Reiniciar servicios
systemctl start neuralhack-api
systemctl start neuralhack-worker

# 8. Verificar que los servicios estén funcionando
sleep 10
if curl -f http://localhost:3000/health; then
    echo "Actualización completada exitosamente"
else
    echo "Error en la actualización, iniciando rollback"
    ./rollback.sh pre-update-$VERSION
    exit 1
fi
```

## Resolución de Problemas

### Problemas Comunes

#### Alto Uso de CPU
```bash
# Identificar procesos que consumen más CPU
top -o %CPU

# Verificar consultas lentas en base de datos
psql -d neuralhack -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
"

# Reiniciar servicios si es necesario
systemctl restart neuralhack-api
```

#### Problemas de Conectividad
```bash
# Verificar estado de servicios
systemctl status neuralhack-api
systemctl status postgresql
systemctl status nginx

# Verificar puertos abiertos
netstat -tlnp | grep -E ':(3000|5432|80|443)'

# Verificar logs de error
tail -f /var/log/neuralhack/error.log
tail -f /var/log/postgresql/postgresql.log
tail -f /var/log/nginx/error.log
```

#### Problemas de Base de Datos
```sql
-- Verificar conexiones activas
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity 
WHERE state = 'active';

-- Identificar bloqueos
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Verificar espacio en disco de la base de datos
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;
```

### Contactos de Escalación

#### Niveles de Escalación
1. **Nivel 1 - Soporte Técnico**
   - Email: soporte@neuralhack.com
   - Teléfono: +52 55 1234 5678
   - Horario: 24/7

2. **Nivel 2 - Administrador de Sistema**
   - Email: admin@neuralhack.com
   - Teléfono: +52 55 9876 5432
   - Horario: 8:00 - 20:00

3. **Nivel 3 - Arquitecto de Sistema**
   - Email: arquitecto@neuralhack.com
   - Teléfono: +52 55 5555 1234
   - Horario: Bajo demanda

4. **Nivel 4 - CTO**
   - Email: cto@neuralhack.com
   - Teléfono: +52 55 1111 2222
   - Horario: Emergencias críticas

---

**Documento**: Guía de Administrador v1.0  
**Fecha**: Diciembre 2024  
**Autor**: Equipo de Sistemas NeuralHack  
**Revisión**: Pendiente  
**Próxima Actualización**: Enero 2025