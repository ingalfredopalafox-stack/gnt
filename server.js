const jsonServer = require('json-server');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// Códigos de clima oficiales (WMO): 0=Despejado, 3=Nublado, 80=Lluvia
const codigosClima = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86];

// Banco de ubicaciones compartidas (Usa "lon" de forma unificada)
const catalogoUbicaciones = [
  {
    "country": "Mexico",
    "countryCode": "MX",
    "regionName": "Estado de México",
    "city": "Texcoco",
    "lat": 19.5135,
    "lon": -98.8824,
    "timezone": "America/Mexico_City",
    "isp": "Telmex"
  },
  {
    "country": "United States",
    "countryCode": "US",
    "regionName": "California",
    "city": "Mountain View",
    "lat": 37.4220,
    "lon": -122.0841,
    "timezone": "America/Los_Angeles",
    "isp": "Google LLC"
  },
  {
    "country": "Spain",
    "countryCode": "ES",
    "regionName": "Comunidad de Madrid",
    "city": "Madrid",
    "lat": 40.4167,
    "lon": -3.7037,
    "timezone": "Europe/Madrid",
    "isp": "Telefonica de Espana"
  }
];

// Estado global en memoria para guardar las acciones de tus botones de Android
let estadoActuadores = {
  water_pump: 0,
  fert_pump: 0,
  auto: false
};

// Estructura inicial con "lon" corregido
const dbInicial = {
  sensores: {
    sensors: { temperature: 25.0, humidity: 50.0, soil: 50 },
    location: { 
      lat: 19.4326, 
      lon: -99.1332,
      country: "Mexico",
      regionName: "CDMX",
      city: "Ciudad de México"
    },
    weather_code: 0,
    is_day: 1,
    water_pump: 0,
    fert_pump: 0,
    auto: false
  }
};

const router = jsonServer.router(dbInicial);

// Bucle que actualiza los sensores, alterna las ubicaciones y el clima cada 1 segundo
setInterval(() => {
  const temperaturaAleatoria = (20 + Math.random() * 10).toFixed(1);
  const humedadAleatoria = (40 + Math.random() * 30).toFixed(1);
  const sueloAleatorio = Math.floor(30 + Math.random() * 40);

  const climaAleatorio = codigosClima[Math.floor(Math.random() * codigosClima.length)];
  const diaONoche = Math.random() > 0.5 ? 1 : 0;

  // Selecciona una ubicación al azar para alternarla en este segundo
  const ubicacionActual = catalogoUbicaciones[Math.floor(Math.random() * catalogoUbicaciones.length)];

  const nuevoJson = {
    "sensors": {
      "temperature": parseFloat(temperaturaAleatoria),
      "humidity": parseFloat(humedadAleatoria),
      "soil": sueloAleatorio
    },
    "location": {
      "lat": ubicacionActual.lat,
      "lon": ubicacionActual.lon, // <-- Cambiado de lng a lon con éxito
      "country": ubicacionActual.country,
      "regionName": ubicacionActual.regionName,
      "city": ubicacionActual.city
    },
    "weather_code": climaAleatorio,
    "is_day": diaONoche,
    "water_pump": estadoActuadores.water_pump ? 1 : 0,
    "fert_pump": estadoActuadores.fert_pump ? 1 : 0,
    "auto": estadoActuadores.auto
  };

  // Guarda los cambios en la RAM de json-server
  router.db.set('sensores', nuevoJson).write();
}, 1000);

server.use(jsonServer.bodyParser);
server.use(middlewares);

// ENDPOINT INTERCEPTOR: Recibe los clics de botones de Android
server.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.url === '/sensores') {
    const datosRecibidos = req.body;

    if (datosRecibidos.water_pump !== undefined) estadoActuadores.water_pump = datosRecibidos.water_pump;
    if (datosRecibidos.fert_pump !== undefined) estadoActuadores.fert_pump = datosRecibidos.fert_pump;
    if (datosRecibidos.auto !== undefined) estadoActuadores.auto = datosRecibidos.auto;
    
    return res.json({ status: "success", message: "Actuadores actualizados", ...estadoActuadores });
  }
  next();
});

// ENDPOINT SIMULADOR IP-API
server.get('/json/:ip', (req, res) => {
  const ipConsultada = req.params.ip;
  const ubicacionAleatoria = catalogoUbicaciones[Math.floor(Math.random() * catalogoUbicaciones.length)];

  res.json({
    "status": "success",
    "country": ubicacionAleatoria.country,
    "countryCode": ubicacionAleatoria.countryCode,
    "regionName": ubicacionAleatoria.regionName,
    "city": ubicacionAleatoria.city,
    "lat": ubicacionAleatoria.lat,
    "lon": ubicacionAleatoria.lon, // Utiliza "lon" directamente
    "timezone": ubicacionAleatoria.timezone,
    "isp": ubicacionAleatoria.isp,
    "query": ipConsultada
  });
});

server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor GrowNet corriendo en el puerto ${PORT}`);
});
