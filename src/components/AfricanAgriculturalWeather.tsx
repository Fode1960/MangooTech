import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, Eye, AlertTriangle } from 'lucide-react';

interface WeatherData {
  location: string;
  coordinates: { lat: number; lng: number };
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    icon: string;
  };
  forecast: DayForecast[];
  agriculturalAdvice: AgriculturalAdvice[];
}

interface DayForecast {
  date: Date;
  maxTemp: number;
  minTemp: number;
  condition: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface AgriculturalAdvice {
  id: string;
  type: 'irrigation' | 'planting' | 'harvest' | 'protection' | 'fertilizer';
  priority: 'low' | 'medium' | 'high';
  message: string;
  crop: string;
  validUntil: Date;
}

interface CropData {
  name: string;
  optimalTemp: { min: number; max: number };
  optimalHumidity: { min: number; max: number };
  waterNeeds: number;
  currentStage: string;
  daysToHarvest: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

const AfricanAgriculturalWeather: React.FC = () => {
  const [weatherData] = useState<WeatherData[]>([
    {
      location: 'Kaolack, Sénégal',
      coordinates: { lat: 14.15, lng: -16.08 },
      current: {
        temperature: 32,
        humidity: 65,
        windSpeed: 12,
        condition: 'Partiellement nuageux',
        icon: 'partly-cloudy'
      },
      forecast: [
        {
          date: new Date('2024-02-13'),
          maxTemp: 34,
          minTemp: 24,
          condition: 'Ensoleillé',
          precipitation: 0,
          humidity: 60,
          windSpeed: 10,
          icon: 'sunny'
        },
        {
          date: new Date('2024-02-14'),
          maxTemp: 31,
          minTemp: 23,
          condition: 'Pluie légère',
          precipitation: 5,
          humidity: 75,
          windSpeed: 15,
          icon: 'rain'
        },
        {
          date: new Date('2024-02-15'),
          maxTemp: 29,
          minTemp: 22,
          condition: 'Nuageux',
          precipitation: 2,
          humidity: 70,
          windSpeed: 8,
          icon: 'cloudy'
        }
      ],
      agriculturalAdvice: [
        {
          id: '1',
          type: 'irrigation',
          priority: 'high',
          message: 'Réduire l\'irrigation demain en raison des pluies prévues',
          crop: 'Tomates',
          validUntil: new Date('2024-02-14')
        },
        {
          id: '2',
          type: 'harvest',
          priority: 'medium',
          message: 'Récolte des mangues recommandée avant la pluie de jeudi',
          crop: 'Mangues',
          validUntil: new Date('2024-02-13')
        }
      ]
    },
    {
      location: 'Bamako, Mali',
      coordinates: { lat: 12.6392, lng: -8.0029 },
      current: {
        temperature: 28,
        humidity: 45,
        windSpeed: 8,
        condition: 'Clair',
        icon: 'sunny'
      },
      forecast: [
        {
          date: new Date('2024-02-13'),
          maxTemp: 30,
          minTemp: 18,
          condition: 'Ensoleillé',
          precipitation: 0,
          humidity: 42,
          windSpeed: 7,
          icon: 'sunny'
        },
        {
          date: new Date('2024-02-14'),
          maxTemp: 32,
          minTemp: 20,
          condition: 'Ensoleillé',
          precipitation: 0,
          humidity: 40,
          windSpeed: 9,
          icon: 'sunny'
        }
      ],
      agriculturalAdvice: [
        {
          id: '3',
          type: 'planting',
          priority: 'medium',
          message: 'Conditions optimales pour semer le mil cette semaine',
          crop: 'Mil',
          validUntil: new Date('2024-02-16')
        }
      ]
    }
  ]);

  const [cropData] = useState<CropData[]>([
    {
      name: 'Tomates',
      optimalTemp: { min: 20, max: 30 },
      optimalHumidity: { min: 60, max: 80 },
      waterNeeds: 500,
      currentStage: 'Croissance active',
      daysToHarvest: 25,
      healthStatus: 'excellent'
    },
    {
      name: 'Mangues',
      optimalTemp: { min: 24, max: 35 },
      optimalHumidity: { min: 40, max: 70 },
      waterNeeds: 300,
      currentStage: 'Maturation',
      daysToHarvest: 5,
      healthStatus: 'good'
    },
    {
      name: 'Mil',
      optimalTemp: { min: 25, max: 35 },
      optimalHumidity: { min: 30, max: 60 },
      waterNeeds: 200,
      currentStage: 'Germination',
      daysToHarvest: 90,
      healthStatus: 'good'
    }
  ]);

  const [selectedLocation, setSelectedLocation] = useState<WeatherData>(weatherData[0]);
  const [selectedTab, setSelectedTab] = useState<'weather' | 'crops' | 'advice'>('weather');
  const [selectedCrop, setSelectedCrop] = useState<CropData | null>(null);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny': return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'partly-cloudy': return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'cloudy': return <Cloud className="w-8 h-8 text-gray-600" />;
      case 'rain': return <CloudRain className="w-8 h-8 text-blue-500" />;
      default: return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getAdviceIcon = (type: string) => {
    switch (type) {
      case 'irrigation': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'planting': return <Eye className="w-5 h-5 text-green-500" />;
      case 'harvest': return <Sun className="w-5 h-5 text-orange-500" />;
      case 'protection': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'fertilizer': return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default: return <Eye className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const isConditionOptimal = (currentTemp: number, currentHumidity: number, crop: CropData): boolean => {
    return (
      currentTemp >= crop.optimalTemp.min &&
      currentTemp <= crop.optimalTemp.max &&
      currentHumidity >= crop.optimalHumidity.min &&
      currentHumidity <= crop.optimalHumidity.max
    );
  };

  const simulateIrrigation = (cropName: string) => {
    alert(`Démarrage de l'irrigation pour ${cropName} - Intégration avec système IoT`);
  };

  const getWeatherAlert = (weather: WeatherData): string | null => {
    const current = weather.current;
    if (current.temperature > 35) {
      return 'Alerte chaleur excessive - Protégez vos cultures';
    }
    if (current.humidity < 30) {
      return 'Humidité très basse - Augmentez l\'irrigation';
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Météo Agricole Africaine</h1>
        <p className="text-lg text-gray-600">Prévisions météo et conseils agricoles intelligents</p>
      </div>

      {/* Sélecteur de localisation */}
      <div className="mb-8">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {weatherData.map((location) => (
              <button
                key={location.location}
                onClick={() => setSelectedLocation(location)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedLocation.location === location.location
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                <MapPin className="w-5 h-5 inline mr-2" />
                {location.location.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'weather'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Cloud className="w-5 h-5 inline mr-2" />
            Météo
          </button>
          <button
            onClick={() => setActiveTab('crops')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'crops'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Leaf className="w-5 h-5 inline mr-2" />
            Cultures
          </button>
          <button
            onClick={() => setActiveTab('advice')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'advice'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Conseils
          </button>
        </div>
      </div>

      {/* Météo actuelle */}
      {activeTab === 'weather' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Conditions actuelles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Conditions Actuelles</h2>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-4xl font-bold text-gray-800">
                    {selectedLocation.current.temperature}°C
                  </p>
                  <p className="text-gray-600">{selectedLocation.current.condition}</p>
                </div>
                <div>
                  {getWeatherIcon(selectedLocation.current.icon)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Droplets className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-gray-500 text-sm">Humidité</p>
                    <p className="font-semibold">{selectedLocation.current.humidity}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wind className="w-6 h-6 text-gray-500" />
                  <div>
                    <p className="text-gray-500 text-sm">Vent</p>
                    <p className="font-semibold">{selectedLocation.current.windSpeed} km/h</p>
                  </div>
                </div>
              </div>

              {/* Alerte météo */}
              {getWeatherAlert(selectedLocation) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">{getWeatherAlert(selectedLocation)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prévisions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Prévisions 7 Jours</h3>
              <div className="space-y-3">
                {selectedLocation.forecast.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(day.icon)}
                      <div>
                        <p className="font-medium">{day.date.toLocaleDateString('fr-FR', { weekday: 'long' })}</p>
                        <p className="text-sm text-gray-600">{day.condition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{day.maxTemp}° / {day.minTemp}°</p>
                      {day.precipitation > 0 && (
                        <p className="text-sm text-blue-600">{day.precipitation}mm</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carte et coordonnées */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Localisation</h3>
              <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-600">Carte interactive</p>
                  <p className="text-sm text-gray-500">
                    {selectedLocation.coordinates.lat}°, {selectedLocation.coordinates.lng}°
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Coordonnées GPS:</strong><br/>
                Latitude: {selectedLocation.coordinates.lat}<br/>
                Longitude: {selectedLocation.coordinates.lng}
              </p>
            </div>

            {/* Données historiques */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Données Historiques</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Moyenne mensuelle:</span>
                  <span className="font-medium">28°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Précipitations annuelles:</span>
                  <span className="font-medium">650mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jours ensoleillés/an:</span>
                  <span className="font-medium">285</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cultures */}
      {activeTab === 'crops' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-4">État des Cultures</h2>
            {cropData.map((crop) => (
              <div
                key={crop.name}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCrop(crop)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{crop.name}</h3>
                    <p className="text-gray-600">{crop.currentStage}</p>
                  </div>
                  <div className={`text-lg font-bold ${getHealthColor(crop.healthStatus)}`}>
                    {crop.healthStatus.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Température optimale</p>
                    <p className="font-medium">
                      {crop.optimalTemp.min}°C - {crop.optimalTemp.max}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Humidité optimale</p>
                    <p className="font-medium">
                      {crop.optimalHumidity.min}% - {crop.optimalHumidity.max}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">Jours jusqu'à récolte</p>
                    <p className="font-semibold">{crop.daysToHarvest} jours</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{crop.waterNeeds}L/jour</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Détails de la culture sélectionnée */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedCrop ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Analyse Détaillée</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Conditions Actuelles vs Optimales</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-gray-600">Température actuelle</p>
                        <p className="font-semibold">{selectedLocation.current.temperature}°C</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        isConditionOptimal(selectedLocation.current.temperature, selectedLocation.current.humidity, selectedCrop)
                          ? 'text-green-600 bg-green-100'
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {isConditionOptimal(selectedLocation.current.temperature, selectedLocation.current.humidity, selectedCrop) ? 'Optimal' : 'Non optimal'}
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-gray-600">Humidité actuelle</p>
                        <p className="font-semibold">{selectedLocation.current.humidity}%</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Optimal: {selectedCrop.optimalHumidity.min}%-{selectedCrop.optimalHumidity.max}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Recommandations d\'Irrigation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-blue-500" />
                        <span>Quantité recommandée</span>
                      </div>
                      <span className="font-semibold">{selectedCrop.waterNeeds}L/jour</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        <span>Meilleur moment</span>
                      </div>
                      <span className="font-semibold">6h - 8h</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => simulateIrrigation(selectedCrop.name)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Démarrer l\'irrigation intelligente
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Sélectionnez une culture pour voir l'analyse détaillée</p>
            )}
          </div>
        </div>
      )}

      {/* Conseils agricoles */}
      {activeTab === 'advice' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Conseils Agricoles Personnalisés</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedLocation.agriculturalAdvice.map((advice) => (
              <div key={advice.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getAdviceIcon(advice.type)}
                    <div>
                      <h3 className="font-semibold capitalize">{advice.type}</h3>
                      <p className="text-sm text-gray-600">{advice.crop}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(advice.priority)}`}>
                    {advice.priority}
                  </span>
                </div>

                <p className="text-gray-800 mb-4">{advice.message}</p>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    Valide jusqu'au: {advice.validUntil.toLocaleDateString()}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    Appliquer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Système d'alertes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Système d\'Alertes</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Sun className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Conditions optimales</p>
                  <p className="text-sm text-green-600">Parfait pour la plantation cette semaine</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Rappel d\'arrosage</p>
                  <p className="text-sm text-yellow-600">Réduire l\'irrigation avant la pluie prévue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfricanAgriculturalWeather;