
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
// A.M.A.R. v4.1
// ST7789 + MAX30102 + BLE
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
    constexpr long UMBRAL_DEDO = 90000;
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

const uint16_t COLOR_FONDO = ST77XX_BLACK;
const uint16_t COLOR_VERDE = ST77XX_GREEN;
const uint16_t COLOR_BLANCO = ST77XX_WHITE;
const uint16_t COLOR_AMARILLO = ST77XX_YELLOW;
const uint16_t COLOR_ROJO = ST77XX_RED;

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

  pantalla.drawRect(3, 3, 164, 43, COLOR_VERDE);

  pantalla.setTextColor(COLOR_VERDE);
  pantalla.setTextSize(2);
  pantalla.setCursor(12, 9);
  pantalla.print("A.M.A.R");

  pantalla.setTextSize(1);
  pantalla.setCursor(12, 31);
  pantalla.print("MONITOREO DE LATIDOS");

  pantalla.drawRect(5, 52, 160, 35, COLOR_VERDE);
  pantalla.setCursor(11, 58);
  pantalla.print("ESTADO DEL SENSOR");

  pantalla.setCursor(10, 96);
  pantalla.print("FRECUENCIA CARDIACA");
  pantalla.drawFastHLine(8, 112, 154, COLOR_VERDE);

  pantalla.drawFastHLine(8, 174, 154, COLOR_VERDE);
  pantalla.setCursor(10, 183);
  pantalla.print("PROMEDIO LPM");

  pantalla.setCursor(10, 216);
  pantalla.print("CALIDAD:");

  pantalla.drawFastHLine(8, 238, 154, COLOR_VERDE);

  pantalla.setCursor(10, 247);
  pantalla.print("SENSOR:");

  pantalla.setCursor(10, 265);
  pantalla.print("BLUETOOTH:");

  pantalla.drawFastHLine(8, 285, 154, COLOR_VERDE);
  pantalla.setCursor(10, 294);
  pantalla.print("HORA:");

  pantalla.drawRect(3, 3, 164, 314, COLOR_VERDE);
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
  pantalla.setSPISpeed(40000000);

  pantalla.fillScreen(COLOR_FONDO);
  pantalla.setTextColor(COLOR_VERDE);
  pantalla.setTextSize(2);
  pantalla.setCursor(14, 115);
  pantalla.print("A.M.A.R");

  pantalla.setTextSize(1);
  pantalla.setCursor(14, 143);
  pantalla.print("INICIANDO SISTEMA...");

  delay(700);

  dibujarPantallaBase();
  pantallaInicializada = true;

  Serial.println("Pantalla ST7789 inicializada.");
}

void escribirCampo(
  int x, int y, int ancho, int alto,
  const char* texto, uint16_t color,
  uint8_t tamano
) {
  pantalla.fillRect(x, y, ancho, alto, COLOR_FONDO);
  pantalla.setCursor(x, y);
  pantalla.setTextSize(tamano);
  pantalla.setTextColor(color);
  pantalla.print(texto);
}

void actualizarPantalla() {
  if (!pantallaInicializada) return;

  const unsigned long ahora = millis();

  if (ahora - tiempoUltimaPantalla < 500) return;
  tiempoUltimaPantalla = ahora;

  const char* estado = obtenerEstadoSensor();
  uint16_t colorEstado = COLOR_AMARILLO;

  if (strcmp(estado, "error_sensor") == 0) {
    colorEstado = COLOR_ROJO;
  } else if (strcmp(estado, "midiendo") == 0) {
    colorEstado = COLOR_VERDE;
  }

  const char* textoEstado = "SIN DEDO";

  if (strcmp(estado, "error_sensor") == 0) {
    textoEstado = "ERROR SENSOR";
  } else if (strcmp(estado, "estabilizando") == 0) {
    textoEstado = "ESTABILIZANDO";
  } else if (strcmp(estado, "midiendo") == 0) {
    textoEstado = "MONITOREANDO";
  }

  escribirCampo(
    11, 70, 146, 14,
    textoEstado, colorEstado, 1
  );

  char textoLPM[12];

  if (hayMedicionValida()) {
    snprintf(
      textoLPM, sizeof(textoLPM),
      "%d", (int)(ultimoLPM + 0.5f)
    );
  } else {
    snprintf(textoLPM, sizeof(textoLPM), "--");
  }

  escribirCampo(14, 126, 105, 43, textoLPM, COLOR_VERDE, 4);
  escribirCampo(117, 141, 38, 20, "LPM", COLOR_BLANCO, 2);

  char textoPromedio[20];

  if (hayMedicionValida() && promedioLPM > 0) {
    snprintf(
      textoPromedio, sizeof(textoPromedio),
      "%d LPM", (int)(promedioLPM + 0.5f)
    );
  } else {
    snprintf(textoPromedio, sizeof(textoPromedio), "-- LPM");
  }

  escribirCampo(
    88, 183, 70, 15,
    textoPromedio, COLOR_VERDE, 1
  );

  char textoCalidad[16];

  snprintf(
    textoCalidad, sizeof(textoCalidad),
    "%d/5", calcularCalidad()
  );

  escribirCampo(
    72, 216, 80, 15,
    textoCalidad, COLOR_VERDE, 1
  );

  escribirCampo(
    58, 247, 98, 14,
    sensorActivo && !sensorDesconectado
      ? "CONECTADO" : "ERROR",
    sensorActivo && !sensorDesconectado
      ? COLOR_VERDE : COLOR_ROJO,
    1
  );

  escribirCampo(
    78, 265, 78, 14,
    bleConectado ? "CONECTADO" : "ESPERANDO",
    bleConectado ? COLOR_VERDE : COLOR_AMARILLO,
    1
  );

  char timestamp[40] = {};
  obtenerTimestampISO8601(timestamp, sizeof(timestamp));

  char hora[12] = "--:--:--";

  if (strlen(timestamp) >= 19 && timestamp[10] == 'T') {
    memcpy(hora, timestamp + 11, 8);
    hora[8] = '\0';
  }

  escribirCampo(
    51, 294, 106, 14,
    hora, COLOR_VERDE, 1
  );
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