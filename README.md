# Bot de Telegram - Gestión de Procesos Legales

Bot de Telegram para registrar y gestionar información de abogados, plataformas y procesos legales en una base de datos MySQL.

## 🚀 Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/REVISIONESTADOS.git
cd REVISIONESTADOS
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
   - Crea un archivo `.env` en la raíz del proyecto:
```env
BOT_TOKEN=tu_bot_token_de_telegram_aqui
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=revision_estados
DB_PORT=3306
```

4. **Configurar la base de datos:**
   - Crea una base de datos MySQL llamada `revision_estados`
   - Ejecuta el script SQL que está en `database.txt` para crear las tablas

## 📱 Crear Bot de Telegram

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Usa el comando `/newbot`
3. Sigue las instrucciones para nombrar tu bot
4. Guarda el token que te proporciona
5. Agrega el token al archivo `.env`

## ▶️ Ejecutar el Bot

```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

## 🤖 Comandos del Bot

### Comandos Principales:
- `/start` - Menú principal del bot
- `/registrar_abogado` - Registrar nuevo abogado
- `/registrar_plataforma` - Registrar nueva plataforma
- `/registrar_proceso` - Registrar nuevo proceso

### Comandos de Consulta:
- `/listar_abogados` - Ver todos los abogados registrados
- `/listar_plataformas` - Ver todas las plataformas registradas
- `/listar_procesos` - Ver los procesos registrados (últimos 10)

## 📋 Flujos de Uso

### 1. Registrar Abogado
```
/registrar_abogado
Bot: "Ingresa el nombre del abogado:"
Usuario: "Juan Pérez"
Bot: "Ingresa el email (o /skip):"
Usuario: "juan@email.com"
Bot: "Ingresa el teléfono (o /skip):"
Usuario: "123456789"
Bot: "✅ Abogado registrado exitosamente"
```

### 2. Registrar Plataforma
```
/registrar_plataforma
Bot: "Ingresa el nombre de la plataforma:"
Usuario: "Rama Judicial"
Bot: [Botones: API | WebScraping | Omitir]
Bot: "Ingresa la URL base (o /skip):"
Usuario: "https://consultaprocesos.ramajudicial.gov.co"
Bot: "✅ Plataforma registrada exitosamente"
```

### 3. Registrar Proceso
```
/registrar_proceso
Bot: [Lista de abogados registrados]
Usuario: [Selecciona abogado]
Bot: [Lista de plataformas registradas]
Usuario: [Selecciona plataforma]
Bot: "Ingresa el número de radicación:"
Usuario: "12345678901234567890"
Bot: [Solicita datos adicionales opcionales]
Bot: "✅ Proceso registrado exitosamente"
```

## 🗃️ Estructura de Base de Datos

### Tabla: abogados
- `id` (AUTO_INCREMENT PRIMARY KEY)
- `nombre` (VARCHAR 255, NOT NULL)
- `email` (VARCHAR 255, opcional)
- `telefono` (VARCHAR 50, opcional)
- `creado_en` (TIMESTAMP)

### Tabla: plataformas
- `id` (AUTO_INCREMENT PRIMARY KEY)
- `nombre` (VARCHAR 100, NOT NULL UNIQUE)
- `tipo` (VARCHAR 50) - API o WebScraping
- `url_base` (VARCHAR 255)
- `activo` (BOOLEAN, default TRUE)

### Tabla: procesos
- `id` (AUTO_INCREMENT PRIMARY KEY)
- `numero_radicacion` (VARCHAR 50, NOT NULL)
- `id_proceso_rama` (BIGINT, opcional)
- `juzgado` (VARCHAR 255, opcional)
- `estado` (VARCHAR 255, opcional)
- `fecha_radicacion` (DATE, opcional)
- `abogado_id` (INT, FK)
- `plataforma_id` (INT, FK)
- `ultima_actuacion_guardada` (DATE, opcional)
- `creado_en` (TIMESTAMP)

## 🔧 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Telegraf** v4.16.3 - Framework para bots de Telegram
- **MySQL2** v3.6.5 - Cliente MySQL para Node.js
- **dotenv** v16.3.1 - Gestión de variables de entorno
- **nodemon** v3.0.2 - Auto-reload en desarrollo

## 📝 Notas

- El bot valida que existan abogados y plataformas antes de permitir registrar procesos
- Todos los campos opcionales pueden omitirse enviando `/skip`
- Las fechas deben ingresarse en formato YYYY-MM-DD
- La conexión a la base de datos se verifica al iniciar el bot

## 🚨 Troubleshooting

### Error de conexión a base de datos:
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que la base de datos esté accesible
- Confirma que las tablas estén creadas
- Verifica que el servicio de MySQL esté ejecutándose

### Bot no responde:
- Verifica que el token del bot sea correcto
- Revisa los logs en la consola para errores
- Asegúrate de que el bot esté iniciado correctamente
- Confirma que tengas conexión a internet

### Errores comunes:
- **"Cannot find module"**: Ejecuta `npm install`
- **"Port already in use"**: Detén otras instancias del bot
- **"Invalid token"**: Verifica el token en el archivo `.env`

## 📂 Estructura del Proyecto

```
REVISIONESTADOS/
├── handlers/           # Manejadores de comandos del bot
├── .env               # Variables de entorno (no incluido en git)
├── .gitignore         # Archivos ignorados por git
├── auth.js            # Autenticación y configuración
├── database.js        # Configuración de base de datos
├── database.txt       # Script SQL para crear tablas
├── index.js           # Archivo principal del bot
├── package.json       # Dependencias y scripts
├── README.md          # Documentación del proyecto
└── test-*.js          # Archivos de prueba
```