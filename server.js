const jsonServer = require('json-server');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

const codigosClima =; // 0=Despejado, 3=Nublado, 80=Lluvia

let estadoActuadores = {
  water_pump: 0,
  fert_pump: 0,
  auto: false
};

// Modificamos esto para que desde el segundo cero tenga la estructura correcta
const dbInicial = {
  sensores: {
    sensors: { temperature: 25.0, humidity: 50.0, soil: 50 },
    location: { lat: 19.4326, lng: -99.1332 },
    weather_code: 0,
    is_day: 1,
    water_pump: 0,
    fert_pump: 0,
    auto: false
  }
};

const router = jsonServer.router(dbInicial);

setInterval(() => {
  const temperaturaAleatoria = (20 + Math.random() * 10).toFixed(1);
  const humedadAleatoria = (40 + Math.random() * 30).toFixed(1);
  const sueloAleatorio = Math.floor(30 + Math.random() * 40);

  const climaAleatorio = codigosClima[Math.floor(Math.random() * codigosClima.length)];
  const diaONoche = Math.random() > 0.5 ? 1 : 0;

  const nuevoJson = {
    "sensors": {
      "temperature": parseFloat(temperaturaAleatoria),
      "humidity": parseFloat(humedadAleatoria),
      "soil": sueloAleatorio
    },
    "location": {
      "lat": 19.4326,
      "lng": -99.1332
    },
    "weather_code": climaAleatorio,
    "is_day": diaONoche,
    "water_pump": estadoActuadores.water_pump ? 1 : 0,
    "fert_pump": estadoActuadores.fert_pump ? 1 : 0,
    "auto": estadoActuadores.auto
  };

  router.db.set('sensores', nuevoJson).write();
}, 1000);

server.use(jsonServer.bodyParser);
server.use(middlewares);

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

server.get('/json/:ip', (req, res) => {
  const ipConsultada = req.params.ip;
  const ubicacionesSimuladas = [
    {
      "country": "Mexico", "countryCode": "MX", "region": "MEX",
      "regionName": "Estado de México", "city": "Texcoco", "zip": "56100",
      "lat": 19.5135, "lon": -98.8824, "timezone": "America/Mexico_City",
      "isp": "Telmex", "org": "Uninet S.A. de C.V.", "as": "AS8151 UNINET"
    },
    {
      "country": "United States", "countryCode": "US", "region": "CA",
      "regionName": "California", "city": "Mountain View", "zip": "94043",
      "lat": 37.4220, "lon": -122.0841, "timezone": "America/Los_Angeles",
      "isp": "Google LLC", "org": "Google LLC", "as": "AS15169 Google LLC"
    }
  ];
  const indiceAleatorio = Math.floor(Math.random() * ubicacionesSimuladas.length);
  const datosUbicacion = ubicacionesSimuladas[indiceAleatorio];
  res.json({ "status": "success", ...datosUbicacion, "query": ipConsultada });
});

server.use(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
