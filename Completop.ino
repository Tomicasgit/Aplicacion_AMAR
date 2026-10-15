
#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <time.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>

#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <MAX30105.h>
#include "heartRate.h"

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

// ============================================================
// A.M.A.R. — Asistente de Monitoreo Autónomo de Ritmo
// Firmware v4.1: ST7789 + MAX30102 + BLE
// JSON + ISO 8601
// Estados independientes del sensor y de la medición.
// Sin Wi-Fi: la aplicación sincroniza la fecha y la hora.
// ============================================================

static constexpr const char* FW_VERSION = "v4.1";

// -------------------- CONFIGURACIÓN -------------------------

namespace Config {
  namespace Pines {
    constexpr uint8_t I2C_SDA = 25;
    constexpr uint8_t I2C_SCL = 26;

    constexpr uint8_t TFT_MOSI = 23;
    constexpr uint8_t TFT_SCLK = 18;
    constexpr uint8_t TFT_CS   = 15;
    constexpr uint8_t TFT_DC   = 2;
    constexpr uint8_t TFT_RST  = 4;
    constexpr uint8_t TFT_BL   = 32;
  }

  namespace Sensor {
    constexpr uint8_t I2C_ADDRESS = 0x57;
    constexpr long UMBRAL_DEDO = 80000;
    constexpr uint32_t VELOCIDAD_I2C = 400000;

    constexpr uint8_t MAX_FALLOS_I2C = 3;
    constexpr uint8_t NUM_MUESTRAS_PROMEDIO = 4;

    constexpr uint8_t AMPLITUD_ROJA = 0x3F;
    constexpr uint8_t AMPLITUD_VERDE = 0x00;

    constexpr uint16_t FRECUENCIA_MUESTREO = 100;

    constexpr unsigned long ESTABILIZACION_MS = 2000;
    constexpr unsigned long LATIDO_MIN_MS = 300;
    constexpr unsigned long LATIDO_MAX_MS = 2000;
    constexpr unsigned long EXPIRACION_LPM_MS = 5000;

    constexpr unsigned long CHEQUEO_MS = 2000;
    constexpr unsigned long REINTENTO_MS = 5000;
  }

  namespace BLE {
    constexpr const char* NOMBRE = "A.M.A.R";

    constexpr const char* SERVICE_UUID =
      "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

    constexpr const char* CHARACTERISTIC_UUID =
      "beb5483e-36e1-4688-b7f5-ea07361b26a8";

    constexpr unsigned long INTERVALO_TX_MS = 1000;
    constexpr size_t BUFFER_JSON = 256;
  }

  namespace Tiempo {
    constexpr long ZONA_HORARIA_SEGUNDOS = -10800;
  }

  // UMBRALES PROVISIONALES PARA PRUEBAS.
  // No son recomendaciones ni límites clínicos.
  // Revisarlos antes de utilizar el prototipo con usuarios.
  namespace Alertas {
    constexpr float LPM_PRECAUCION_BAJO = 50.0f;
    constexpr float LPM_PRECAUCION_ALTO = 120.0f;

    constexpr float LPM_CRITICO_BAJO = 40.0f;
    constexpr float LPM_CRITICO_ALTO = 150.0f;
  }
}

// -------------------- VARIABLES GLOBALES --------------------

MAX30105 sensor;

bool sensorActivo = false;
bool sensorDesconectado = false;
bool dedoDetectado = false;
bool sensorListo = false;

byte fallosConsecutivosI2C = 0;

long valorIR = 0;

unsigned long tiempoDedoDetectado = 0;
unsigned long tiempoUltimoChequeoSensor = 0;
unsigned long tiempoUltimoIntentoSensor = 0;
unsigned long ultimoLatido = 0;
unsigned long tiempoUltimaMedicionValida = 0;

float lpm = 0;
float ultimoLPM = 0;
float promedioLPM = 0;

float historialLPM[
  Config::Sensor::NUM_MUESTRAS_PROMEDIO
] = {};

byte posicionHistorial = 0;

// -------------------- BLUETOOTH LE --------------------------

BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;

bool bleConectado = false;
unsigned long tiempoUltimoTX = 0;

// -------------------- RELOJ INTERNO -------------------------

bool horaSincronizada = false;
time_t epochBase = 0;
unsigned long millisBase = 0;

// -------------------- PANTALLA ------------------------------

Adafruit_ST7789 pantalla(
  Config::Pines::TFT_CS,
  Config::Pines::TFT_DC,
  Config::Pines::TFT_RST
);

const uint16_t COLOR_FONDO = 0xF7BF;
const uint16_t COLOR_VERDE = 0xE26D;
const uint16_t COLOR_BLANCO = 0xFFFF;
const uint16_t COLOR_AMARILLO = 0xB3C3;
const uint16_t COLOR_ROJO = 0xC9AA;
const uint16_t COLOR_ACENTO = 0xE26D;
const uint16_t COLOR_ACENTO_OSCURO = 0xC9AA;
const uint16_t COLOR_TEXTO = 0x2126;
const uint16_t COLOR_SECUNDARIO = 0x73D1;
const uint16_t COLOR_BORDE = 0xE75D;
const uint16_t COLOR_OK = 0x14AC;

unsigned long tiempoUltimaPantalla = 0;
bool pantallaInicializada = false;

// -------------------- DECLARACIONES -------------------------

void dibujarPantallaBase();
void iniciarPantalla();

void escribirCampo(
  int x, int y, int ancho, int alto,
  const char* texto, uint16_t color,
  uint8_t tamano = 1
);

void actualizarPantalla();

int calcularCalidad();
bool obtenerTimestampISO8601(char* buffer, size_t longitud);
bool establecerTimestamp(const char* timestamp);

bool inicializarSensor();
void configurarSensor();
void procesarSensor();
void controlarExpiracionLPM();
void chequearSaludSensor();

void invalidarMedicion();
void limpiarHistorial();
void agregarMedicion(float nuevaLPM);

const char* obtenerEstadoSensor();
const char* obtenerEstadoUsuario();
bool hayMedicionValida();
bool hayAlertaCritica();

void inicializarBLE();
void enviarDatosBLE();

// ============================================================
// PANTALLA
// ============================================================

void dibujarPantallaBase() {
  pantalla.fillScreen(COLOR_FONDO);
  pantalla.setTextWrap(false);

  // Encabezado oscuro con marca coral, coherente con la app web.
  pantalla.fillRoundRect(6, 6, 158, 43, 8, COLOR_TEXTO);
  pantalla.fillRoundRect(12, 12, 29, 29, 7, COLOR_ACENTO);
  pantalla.drawLine(16, 27, 21, 27, COLOR_BLANCO);
  pantalla.drawLine(21, 27, 25, 19, COLOR_BLANCO);
  pantalla.drawLine(25, 19, 29, 33, COLOR_BLANCO);
  pantalla.drawLine(29, 33, 34, 24, COLOR_BLANCO);
  pantalla.drawLine(34, 24, 38, 24, COLOR_BLANCO);

  pantalla.setTextColor(COLOR_BLANCO);
  pantalla.setTextSize(2);
  pantalla.setCursor(48, 12);
  pantalla.print("A.M.A.R.");
  pantalla.setTextSize(1);
  pantalla.setTextColor(0xD6DA);
  pantalla.setCursor(49, 32);
  pantalla.print("MONITOREO PERSONAL");

  // Estado del contacto.
  pantalla.fillRoundRect(6, 54, 158, 25, 7, COLOR_BLANCO);
  pantalla.drawRoundRect(6, 54, 158, 25, 7, COLOR_BORDE);

  // Tarjeta de frecuencia cardíaca.
  pantalla.fillRoundRect(6, 84, 158, 104, 9, COLOR_BLANCO);
  pantalla.drawRoundRect(6, 84, 158, 104, 9, COLOR_BORDE);
  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.setTextSize(1);
  pantalla.setCursor(15, 94);
  pantalla.print("FRECUENCIA CARDIACA");

  // Línea visual decorativa; no representa un electrocardiograma.
  pantalla.drawFastHLine(17, 170, 25, COLOR_BORDE);
  pantalla.drawLine(42, 170, 48, 170, COLOR_ACENTO);
  pantalla.drawLine(48, 170, 54, 160, COLOR_ACENTO);
  pantalla.drawLine(54, 160, 60, 178, COLOR_ACENTO);
  pantalla.drawLine(60, 178, 66, 165, COLOR_ACENTO);
  pantalla.drawLine(66, 165, 72, 170, COLOR_ACENTO);
  pantalla.drawFastHLine(72, 170, 80, COLOR_BORDE);

  // Tarjetas de promedio y calidad.
  pantalla.fillRoundRect(6, 194, 76, 51, 8, COLOR_BLANCO);
  pantalla.drawRoundRect(6, 194, 76, 51, 8, COLOR_BORDE);
  pantalla.fillRoundRect(88, 194, 76, 51, 8, COLOR_BLANCO);
  pantalla.drawRoundRect(88, 194, 76, 51, 8, COLOR_BORDE);
  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.setTextSize(1);
  pantalla.setCursor(13, 201);
  pantalla.print("PROMEDIO");
  pantalla.setCursor(96, 201);
  pantalla.print("CALIDAD");

  // Estado del sensor y Bluetooth.
  pantalla.fillRoundRect(6, 251, 158, 38, 8, COLOR_BLANCO);
  pantalla.drawRoundRect(6, 251, 158, 38, 8, COLOR_BORDE);
  pantalla.setTextSize(1);
  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.setCursor(13, 258);
  pantalla.print("SENSOR");
  pantalla.setCursor(13, 275);
  pantalla.print("BLUETOOTH");

  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.setCursor(8, 300);
  pantalla.print("HORA");
}

void iniciarPantalla() {
  Serial.println("Inicializando pantalla ST7789...");

  pinMode(Config::Pines::TFT_BL, OUTPUT);
  digitalWrite(Config::Pines::TFT_BL, HIGH);

  SPI.begin(
    Config::Pines::TFT_SCLK,
    -1,
    Config::Pines::TFT_MOSI,
    Config::Pines::TFT_CS
  );

  pantalla.init(170, 320);
  pantalla.setRotation(0);
  pantalla.setSPISpeed(10000000);

  // Prueba visual de arranque.
  pantalla.fillScreen(ST77XX_RED);
  Serial.println("TFT TEST 1/4: ROJO");
  delay(250);
  pantalla.fillScreen(ST77XX_GREEN);
  Serial.println("TFT TEST 2/4: VERDE");
  delay(250);
  pantalla.fillScreen(ST77XX_BLUE);
  Serial.println("TFT TEST 3/4: AZUL");
  delay(250);

  pantalla.fillScreen(ST77XX_BLACK);
  pantalla.setTextWrap(false);
  pantalla.setTextColor(ST77XX_WHITE);
  pantalla.setTextSize(2);
  pantalla.setCursor(10, 110);
  pantalla.print("A.M.A.R");
  pantalla.setTextSize(1);
  pantalla.setCursor(10, 140);
  pantalla.print("PRUEBA TFT v5.0");
  Serial.println("TFT TEST 4/4: TEXTO");
  delay(1200);

  dibujarPantallaBase();
  pantallaInicializada = true;
  Serial.println("Pantalla ST7789 inicializada.");
}

void escribirCampo(
  int x, int y, int ancho, int alto,
  const char* texto, uint16_t color,
  uint8_t tamano
) {
  const char* contenido = texto != nullptr ? texto : "";
  pantalla.fillRect(x, y, ancho, alto, COLOR_BLANCO);
  pantalla.setCursor(x, y);
  pantalla.setTextSize(tamano);
  pantalla.setTextColor(color);
  pantalla.print(contenido);
}

void actualizarPantalla() {
  if (!pantallaInicializada) return;

  const unsigned long ahora = millis();
  if (ahora - tiempoUltimaPantalla < 200) return;
  tiempoUltimaPantalla = ahora;

  const char* estado = obtenerEstadoSensor();
  const bool medicionValida = hayMedicionValida();
  uint16_t colorEstado = COLOR_AMARILLO;
  const char* textoEstado = "SIN CONTACTO";

  if (strcmp(estado, "error_sensor") == 0) {
    colorEstado = COLOR_ROJO;
    textoEstado = "ERROR SENSOR";
  } else if (strcmp(estado, "estabilizando") == 0) {
    colorEstado = COLOR_AMARILLO;
    textoEstado = "LEYENDO PULSO";
  } else if (strcmp(estado, "sin_dedo") == 0) {
    colorEstado = COLOR_ACENTO;
    textoEstado = "SIN CONTACTO";
  } else if (strcmp(estado, "midiendo") == 0) {
    colorEstado = COLOR_OK;
    textoEstado = "MONITOREANDO";
  }

  pantalla.fillRoundRect(9, 57, 152, 19, 5, COLOR_BLANCO);
  pantalla.fillCircle(16, 66, 3, colorEstado);
  pantalla.setCursor(24, 62);
  pantalla.setTextSize(1);
  pantalla.setTextColor(colorEstado);
  pantalla.print(textoEstado);

  // LPM instantáneas: mostrar "--" si no existe una lectura válida.
  pantalla.fillRect(13, 111, 144, 48, COLOR_BLANCO);
  pantalla.setCursor(20, 116);
  pantalla.setTextSize(4);
  pantalla.setTextColor(medicionValida ? COLOR_ACENTO : COLOR_SECUNDARIO);
  if (medicionValida) {
    pantalla.print((int)(ultimoLPM + 0.5f));
  } else {
    pantalla.print("--");
  }
  pantalla.setCursor(119, 133);
  pantalla.setTextSize(1);
  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.print("LPM");

  // Promedio de las lecturas válidas.
  pantalla.fillRect(12, 213, 64, 27, COLOR_BLANCO);
  pantalla.setCursor(19, 216);
  pantalla.setTextSize(2);
  pantalla.setTextColor(medicionValida ? COLOR_ACENTO : COLOR_SECUNDARIO);
  if (medicionValida && promedioLPM > 0) {
    pantalla.printf("%d", (int)(promedioLPM + 0.5f));
  } else {
    pantalla.print("--");
  }
  pantalla.setCursor(51, 224);
  pantalla.setTextSize(1);
  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.print("LPM");

  // Calidad orientativa de la señal (0–5).
  pantalla.fillRect(94, 213, 64, 27, COLOR_BLANCO);
  pantalla.setCursor(105, 216);
  pantalla.setTextSize(2);
  pantalla.setTextColor(calcularCalidad() > 0 ? COLOR_OK : COLOR_SECUNDARIO);
  pantalla.printf("%d/5", calcularCalidad());

  pantalla.fillRect(70, 255, 87, 14, COLOR_BLANCO);
  pantalla.setCursor(72, 258);
  pantalla.setTextSize(1);
  if (!sensorActivo || sensorDesconectado) {
    pantalla.setTextColor(COLOR_ROJO);
    pantalla.print("ERROR");
  } else if (!dedoDetectado) {
    pantalla.setTextColor(COLOR_ACENTO);
    pantalla.print("SIN CONTACTO");
  } else {
    pantalla.setTextColor(COLOR_OK);
    pantalla.print("CONECTADO");
  }

  pantalla.fillRect(78, 272, 79, 14, COLOR_BLANCO);
  pantalla.setCursor(80, 275);
  pantalla.setTextSize(1);
  if (bleConectado) {
    pantalla.setTextColor(COLOR_OK);
    pantalla.print("CONECTADO");
  } else {
    pantalla.setTextColor(COLOR_SECUNDARIO);
    pantalla.print("ESPERANDO");
  }

  char timestamp[40] = {};
  obtenerTimestampISO8601(timestamp, sizeof(timestamp));
  char hora[12] = "--:--:--";
  if (strlen(timestamp) >= 19 && timestamp[10] == 'T') {
    memcpy(hora, timestamp + 11, 8);
    hora[8] = '\0';
  }

  pantalla.fillRect(33, 294, 126, 18, COLOR_FONDO);
  pantalla.setCursor(35, 300);
  pantalla.setTextSize(1);
  pantalla.setTextColor(COLOR_SECUNDARIO);
  pantalla.print(hora);

  static unsigned long ultimaTrazaPantalla = 0;
  if (ahora - ultimaTrazaPantalla >= 2500) {
    ultimaTrazaPantalla = ahora;
    Serial.printf(
      "PANTALLA %s | estado=%s | medicion_valida=%s | LPM=%d | promedio=%d | calidad=%d/5\n",
      FW_VERSION,
      estado,
      medicionValida ? "SI" : "NO",
      medicionValida ? (int)(ultimoLPM + 0.5f) : 0,
      medicionValida ? (int)(promedioLPM + 0.5f) : 0,
      calcularCalidad()
    );
  }
}

// ============================================================
// HISTORIAL DE LPM
// ============================================================

void limpiarHistorial() {
  for (byte i = 0;
       i < Config::Sensor::NUM_MUESTRAS_PROMEDIO;
       ++i) {
    historialLPM[i] = 0;
  }

  posicionHistorial = 0;
  promedioLPM = 0;
}

void invalidarMedicion() {
  dedoDetectado = false;
  sensorListo = false;

  tiempoDedoDetectado = 0;
  ultimoLatido = 0;
  tiempoUltimaMedicionValida = 0;

  lpm = 0;
  ultimoLPM = 0;

  limpiarHistorial();
}

void agregarMedicion(float nuevaLPM) {
  historialLPM[posicionHistorial] = nuevaLPM;

  posicionHistorial =
    (posicionHistorial + 1) %
    Config::Sensor::NUM_MUESTRAS_PROMEDIO;

  float suma = 0;
  byte cantidad = 0;

  for (byte i = 0;
       i < Config::Sensor::NUM_MUESTRAS_PROMEDIO;
       ++i) {
    if (historialLPM[i] > 0) {
      suma += historialLPM[i];
      cantidad++;
    }
  }

  promedioLPM = cantidad > 0 ? suma / cantidad : 0;
}

// ============================================================
// SENSOR MAX30102
// ============================================================

void configurarSensor() {
  sensor.setup(
    0x3F,
    4,
    2,
    Config::Sensor::FRECUENCIA_MUESTREO,
    411,
    4096
  );

  sensor.setPulseAmplitudeRed(Config::Sensor::AMPLITUD_ROJA);
  sensor.setPulseAmplitudeGreen(Config::Sensor::AMPLITUD_VERDE);
}

bool inicializarSensor() {
  Serial.println("Inicializando MAX30102...");

  Wire.begin(
    Config::Pines::I2C_SDA,
    Config::Pines::I2C_SCL
  );

  Wire.setClock(Config::Sensor::VELOCIDAD_I2C);

  if (!sensor.begin(Wire, Config::Sensor::VELOCIDAD_I2C)) {
    Serial.println("ERROR: MAX30102 no encontrado.");

    sensorActivo = false;
    sensorDesconectado = true;
    return false;
  }

  configurarSensor();

  sensorActivo = true;
  sensorDesconectado = false;
  fallosConsecutivosI2C = 0;

  invalidarMedicion();

  Serial.println("MAX30102 inicializado correctamente.");
  return true;
}

void procesarSensor() {
  valorIR = sensor.getIR();

  static unsigned long ultimaLecturaIR = 0;

  if (millis() - ultimaLecturaIR >= 1000) {
    ultimaLecturaIR = millis();

    Serial.print("MAX30102 | IR: ");
    Serial.print(valorIR);
    Serial.print(" | Sensor activo: ");
    Serial.println(sensorActivo ? "SI" : "NO");
  }

  if (valorIR <= Config::Sensor::UMBRAL_DEDO) {
    if (dedoDetectado) {
      Serial.println("Sensor: dedo retirado.");
    }

    invalidarMedicion();
    return;
  }

  if (!dedoDetectado) {
    dedoDetectado = true;
    sensorListo = false;

    tiempoDedoDetectado = millis();
    ultimoLatido = 0;
    tiempoUltimaMedicionValida = 0;

    limpiarHistorial();

    Serial.println("Sensor: dedo detectado.");
  }

  if (millis() - tiempoDedoDetectado <
      Config::Sensor::ESTABILIZACION_MS) {
    return;
  }

  sensorListo = true;

  // No procesar latidos antes de estabilizar el sensor.
  if (!checkForBeat(valorIR)) return;

  const unsigned long ahora = millis();

  if (ultimoLatido != 0) {
    const unsigned long intervalo = ahora - ultimoLatido;

    if (intervalo >= Config::Sensor::LATIDO_MIN_MS &&
        intervalo <= Config::Sensor::LATIDO_MAX_MS) {

      lpm = 60000.0f / intervalo;

      if (lpm >= 45.0f && lpm <= 180.0f) {
        ultimoLPM = lpm;
        tiempoUltimaMedicionValida = ahora;

        agregarMedicion(lpm);

        Serial.printf(
          "LPM: %.1f | Promedio: %.1f\n",
          ultimoLPM, promedioLPM
        );
      }
    }
  }

  ultimoLatido = ahora;
}

void controlarExpiracionLPM() {
  if (tiempoUltimaMedicionValida != 0 &&
      millis() - tiempoUltimaMedicionValida >
        Config::Sensor::EXPIRACION_LPM_MS) {

    if (ultimoLPM != 0) {
      Serial.println("Medición expirada: sin datos recientes.");
    }

    ultimoLPM = 0;
    lpm = 0;
    tiempoUltimaMedicionValida = 0;
    limpiarHistorial();
  }
}

// ============================================================
// SUPERVISIÓN I2C
// ============================================================

void chequearSaludSensor() {
  const unsigned long ahora = millis();

  if (ahora - tiempoUltimoChequeoSensor <
      Config::Sensor::CHEQUEO_MS) {
    return;
  }

  tiempoUltimoChequeoSensor = ahora;

  Wire.beginTransmission(Config::Sensor::I2C_ADDRESS);
  const bool responde = Wire.endTransmission() == 0;

  if (responde) {
    fallosConsecutivosI2C = 0;

    if (!sensorActivo &&
        ahora - tiempoUltimoIntentoSensor >=
          Config::Sensor::REINTENTO_MS) {

      tiempoUltimoIntentoSensor = ahora;

      Serial.println("Reintentando inicialización del MAX30102...");

      if (sensor.begin(Wire, Config::Sensor::VELOCIDAD_I2C)) {
        configurarSensor();

        sensorActivo = true;
        sensorDesconectado = false;

        invalidarMedicion();

        fallosConsecutivosI2C = 0;

        Serial.println("MAX30102 reconectado.");
      } else {
        Serial.println("Falló el reintento del MAX30102.");
      }
    }

    return;
  }

  if (fallosConsecutivosI2C < Config::Sensor::MAX_FALLOS_I2C) {
    fallosConsecutivosI2C++;
  }

  if (fallosConsecutivosI2C >= Config::Sensor::MAX_FALLOS_I2C &&
      !sensorDesconectado) {

    Serial.println("ERROR: MAX30102 sin respuesta I2C.");

    sensorActivo = false;
    sensorDesconectado = true;

    invalidarMedicion();

    Wire.end();
    delay(10);

    Wire.begin(
      Config::Pines::I2C_SDA,
      Config::Pines::I2C_SCL
    );

    Wire.setClock(Config::Sensor::VELOCIDAD_I2C);
  }
}

// ============================================================
// ESTADOS Y CALIDAD
// ============================================================

const char* obtenerEstadoSensor() {
  if (!sensorActivo || sensorDesconectado) {
    return "error_sensor";
  }

  if (!dedoDetectado) return "sin_dedo";
  if (!sensorListo) return "estabilizando";

  return "midiendo";
}

bool hayMedicionValida() {
  if (!sensorActivo || sensorDesconectado ||
      !dedoDetectado || !sensorListo ||
      ultimoLPM <= 0 ||
      tiempoUltimaMedicionValida == 0) {
    return false;
  }

  return millis() - tiempoUltimaMedicionValida <=
         Config::Sensor::EXPIRACION_LPM_MS;
}

const char* obtenerEstadoUsuario() {
  if (!hayMedicionValida()) {
    return "sin_datos";
  }

  if (ultimoLPM <= Config::Alertas::LPM_CRITICO_BAJO ||
      ultimoLPM >= Config::Alertas::LPM_CRITICO_ALTO) {
    return "critico";
  }

  if (ultimoLPM < Config::Alertas::LPM_PRECAUCION_BAJO ||
      ultimoLPM > Config::Alertas::LPM_PRECAUCION_ALTO) {
    return "precaucion";
  }

  return "normal";
}

bool hayAlertaCritica() {
  return hayMedicionValida() &&
         strcmp(obtenerEstadoUsuario(), "critico") == 0;
}

int calcularCalidad() {
  if (!sensorActivo || sensorDesconectado || !dedoDetectado) {
    return 0;
  }

  if (!sensorListo) return 1;
  if (!hayMedicionValida()) return 1;

  if (millis() - tiempoUltimaMedicionValida < 2000) {
    return 5;
  }

  return 3;
}

// ============================================================
// FECHA Y HORA: ISO 8601
// Acepta YYYY-MM-DDTHH:MM:SSZ o YYYY-MM-DDTHH:MM:SS±HH:MM
// ============================================================

int leerDigitos(const char* texto, size_t inicio, size_t cantidad) {
  int resultado = 0;

  for (size_t i = 0; i < cantidad; ++i) {
    const char c = texto[inicio + i];

    if (c < '0' || c > '9') return -1;

    resultado = resultado * 10 + (c - '0');
  }

  return resultado;
}

bool establecerTimestamp(const char* timestamp) {
  if (timestamp == nullptr) return false;

  const size_t longitud = strlen(timestamp);

  // Formatos admitidos: UTC Z o desfase ±HH:MM.
  if (longitud != 20 && longitud != 25) return false;

  if (timestamp[4] != '-' ||
      timestamp[7] != '-' ||
      timestamp[10] != 'T' ||
      timestamp[13] != ':' ||
      timestamp[16] != ':') {
    return false;
  }

  if (longitud == 20 &&
      timestamp[19] != 'Z' &&
      timestamp[19] != 'z') {
    return false;
  }

  if (longitud == 25 &&
      ((timestamp[19] != '+' && timestamp[19] != '-') ||
       timestamp[22] != ':')) {
    return false;
  }

  const int anio = leerDigitos(timestamp, 0, 4);
  const int mes = leerDigitos(timestamp, 5, 2);
  const int dia = leerDigitos(timestamp, 8, 2);
  const int hora = leerDigitos(timestamp, 11, 2);
  const int minuto = leerDigitos(timestamp, 14, 2);
  const int segundo = leerDigitos(timestamp, 17, 2);

  if (anio < 2024 ||
      mes < 1 || mes > 12 ||
      dia < 1 || dia > 31 ||
      hora < 0 || hora > 23 ||
      minuto < 0 || minuto > 59 ||
      segundo < 0 || segundo > 59) {
    return false;
  }

  long desplazamientoZona = 0;

  if (longitud == 25) {
    const int zonaHora = leerDigitos(timestamp, 20, 2);
    const int zonaMinuto = leerDigitos(timestamp, 23, 2);

    if (zonaHora < 0 || zonaHora > 14 ||
        zonaMinuto < 0 || zonaMinuto > 59 ||
        (zonaHora == 14 && zonaMinuto != 0)) {
      return false;
    }

    desplazamientoZona =
      zonaHora * 3600L + zonaMinuto * 60L;

    if (timestamp[19] == '-') {
      desplazamientoZona *= -1;
    }
  }

  struct tm tiempo = {};

  tiempo.tm_year = anio - 1900;
  tiempo.tm_mon = mes - 1;
  tiempo.tm_mday = dia;
  tiempo.tm_hour = hora;
  tiempo.tm_min = minuto;
  tiempo.tm_sec = segundo;
  tiempo.tm_isdst = 0;

  // TZ se establece como UTC0 en setup().
  const time_t epochLocal = mktime(&tiempo);

  if (epochLocal <= 0) return false;

  // Rechazar fechas que mktime haya normalizado.
  if (tiempo.tm_year != anio - 1900 ||
      tiempo.tm_mon != mes - 1 ||
      tiempo.tm_mday != dia ||
      tiempo.tm_hour != hora ||
      tiempo.tm_min != minuto ||
      tiempo.tm_sec != segundo) {
    return false;
  }

  epochBase = epochLocal - desplazamientoZona;
  millisBase = millis();
  horaSincronizada = true;

  Serial.print("Hora sincronizada por BLE: ");
  Serial.println(timestamp);

  return true;
}

bool obtenerTimestampISO8601(char* buffer, size_t longitud) {
  if (!horaSincronizada) {
    if (longitud > 0) buffer[0] = '\0';
    return false;
  }

  const time_t epochActual =
    epochBase + (millis() - millisBase) / 1000;

  const time_t epochArgentina =
    epochActual + Config::Tiempo::ZONA_HORARIA_SEGUNDOS;

  struct tm tiempo = {};

  if (gmtime_r(&epochArgentina, &tiempo) == nullptr) {
    if (longitud > 0) buffer[0] = '\0';
    return false;
  }

  snprintf(
    buffer, longitud,
    "%04d-%02d-%02dT%02d:%02d:%02d-03:00",
    tiempo.tm_year + 1900,
    tiempo.tm_mon + 1,
    tiempo.tm_mday,
    tiempo.tm_hour,
    tiempo.tm_min,
    tiempo.tm_sec
  );

  return true;
}

// ============================================================
// BLE: CALLBACKS
// ============================================================

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer*) override {
    bleConectado = true;
    tiempoUltimoTX = millis();

    Serial.println("BLE: cliente conectado.");
  }

  void onDisconnect(BLEServer* servidor) override {
    bleConectado = false;

    Serial.println("BLE: cliente desconectado.");

    if (servidor != nullptr &&
        servidor->getAdvertising() != nullptr) {
      servidor->getAdvertising()->start();
      Serial.println("BLE: anuncio reiniciado.");
    }
  }
};

class CharacteristicCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* characteristic) override {
    String valor = characteristic->getValue();

    if (valor.isEmpty()) return;

    Serial.print("BLE RX: ");
    Serial.println(valor);

    // La aplicación envía JSON con el campo timestamp.
    const char* inicio = strstr(valor.c_str(), "\"timestamp\"");

    if (inicio == nullptr) {
      Serial.println("BLE RX: falta timestamp.");
      return;
    }

    const char* dosPuntos = strchr(inicio, ':');

    if (dosPuntos == nullptr) {
      Serial.println("BLE RX: JSON inválido.");
      return;
    }

    const char* cursor = dosPuntos + 1;

    while (*cursor && isspace((unsigned char)*cursor)) {
      cursor++;
    }

    if (*cursor != '"') {
      Serial.println("BLE RX: timestamp debe ser texto ISO 8601.");
      return;
    }

    cursor++;

    const char* comillaFinal = strchr(cursor, '"');

    if (comillaFinal == nullptr) {
      Serial.println("BLE RX: timestamp incompleto.");
      return;
    }

    const size_t longitud = comillaFinal - cursor;

    char timestamp[40] = {};

    if (longitud == 0 || longitud >= sizeof(timestamp)) {
      Serial.println("BLE RX: timestamp demasiado largo.");
      return;
    }

    memcpy(timestamp, cursor, longitud);
    timestamp[longitud] = '\0';

    if (!establecerTimestamp(timestamp)) {
      Serial.println("BLE RX: timestamp ISO 8601 inválido.");
    }
  }
};

// ============================================================
// BLE: TELEMETRÍA JSON
// ============================================================

void enviarDatosBLE() {
  if (pCharacteristic == nullptr || !bleConectado) return;

  const unsigned long ahora = millis();

  if (ahora - tiempoUltimoTX < Config::BLE::INTERVALO_TX_MS) {
    return;
  }

  char timestamp[40] = {};

  const bool timestampDisponible =
    obtenerTimestampISO8601(timestamp, sizeof(timestamp));

  const char* estadoSensor = obtenerEstadoSensor();
  const char* estadoUsuario = obtenerEstadoUsuario();

  const int calidad = calcularCalidad();
  const bool alerta = hayAlertaCritica();

  const int valorLPM =
    hayMedicionValida() ? (int)(ultimoLPM + 0.5f) : 0;

  const int valorPromedio =
    hayMedicionValida() ? (int)(promedioLPM + 0.5f) : 0;

  char json[Config::BLE::BUFFER_JSON] = {};

  int longitud;

  if (timestampDisponible) {
    longitud = snprintf(
      json, sizeof(json),
      "{"
        "\"timestamp\":\"%s\","
        "\"lpm\":%d,"
        "\"average\":%d,"
        "\"sensor_state\":\"%s\","
        "\"user_state\":\"%s\","
        "\"quality\":%d,"
        "\"alert\":%s"
      "}",
      timestamp,
      valorLPM,
      valorPromedio,
      estadoSensor,
      estadoUsuario,
      calidad,
      alerta ? "true" : "false"
    );
  } else {
    longitud = snprintf(
      json, sizeof(json),
      "{"
        "\"timestamp\":null,"
        "\"lpm\":%d,"
        "\"average\":%d,"
        "\"sensor_state\":\"%s\","
        "\"user_state\":\"%s\","
        "\"quality\":%d,"
        "\"alert\":%s"
      "}",
      valorLPM,
      valorPromedio,
      estadoSensor,
      estadoUsuario,
      calidad,
      alerta ? "true" : "false"
    );
  }

  if (longitud <= 0 || longitud >= (int)sizeof(json)) {
    Serial.println("BLE TX: error al construir JSON.");
    return;
  }

  pCharacteristic->setValue((uint8_t*)json, longitud);
  pCharacteristic->notify();

  tiempoUltimoTX = ahora;

  Serial.print("BLE TX: ");
  Serial.println(json);
}

// ============================================================
// BLE: INICIALIZACIÓN
// ============================================================

void inicializarBLE() {
  Serial.println("Inicializando Bluetooth Low Energy...");

  BLEDevice::init(Config::BLE::NOMBRE);

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* servicio =
    pServer->createService(Config::BLE::SERVICE_UUID);

  pCharacteristic = servicio->createCharacteristic(
    Config::BLE::CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY |
    BLECharacteristic::PROPERTY_WRITE
  );

  pCharacteristic->setCallbacks(new CharacteristicCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  pCharacteristic->setValue(
    "{\"timestamp\":null,"
    "\"lpm\":0,"
    "\"average\":0,"
    "\"sensor_state\":\"sin_dedo\","
    "\"user_state\":\"sin_datos\","
    "\"quality\":0,"
    "\"alert\":false}"
  );

  servicio->start();
  pServer->getAdvertising()->start();

  Serial.println("BLE inicializado.");
  Serial.print("Nombre: ");
  Serial.println(Config::BLE::NOMBRE);

  Serial.print("Servicio UUID: ");
  Serial.println(Config::BLE::SERVICE_UUID);

  Serial.print("Característica UUID: ");
  Serial.println(Config::BLE::CHARACTERISTIC_UUID);
}

// ============================================================
// SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("================================");
  Serial.println(" A.M.A.R - Firmware v4.1");
  Serial.println(" Pantalla + BLE + MAX30102");
  Serial.println(" JSON + ISO 8601");
  Serial.println(" Sin Wi-Fi");
  Serial.println("================================");

  setenv("TZ", "UTC0", 1);
  tzset();

  iniciarPantalla();
  inicializarSensor();
  inicializarBLE();

  actualizarPantalla();

  Serial.println("Inicialización finalizada.");
}

// ============================================================
// LOOP
// ============================================================

void loop() {
  chequearSaludSensor();

  if (sensorActivo) {
    procesarSensor();
    controlarExpiracionLPM();
  }

  enviarDatosBLE();
  actualizarPantalla();

  delay(5);
}