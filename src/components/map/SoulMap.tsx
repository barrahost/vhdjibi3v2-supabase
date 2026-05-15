import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as GeoJSON from 'geojson';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Soul } from '../../types/database.types';
import type { User } from '../../types/user.types';
import { Filter } from 'lucide-react';
import ShepherdSelect from '../souls/ShepherdSelect';
import { isShepherdUser } from '../../utils/roleHelpers';
import 'mapbox-gl/dist/mapbox-gl.css';
import toast from 'react-hot-toast';

// Configure Mapbox API key from environment variables
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

// Center of Abidjan
const ABIDJAN_CENTER: [number, number] = [
  -4.008256, // longitude
  5.348103   // latitude
];

interface SoulMapProps {
  className?: string;
}

export function SoulMap({ className = '' }: SoulMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentPopup = useRef<mapboxgl.Popup | null>(null);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShepherdId, setSelectedShepherdId] = useState<string | undefined>(undefined);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [stats, setStats] = useState({
    totalSouls: 0,
    geolocatedSouls: 0,
    geolocatedShepherds: 0
  });

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: ABIDJAN_CENTER,
          zoom: 11
        });

        // Wait for map to load
        mapInstance.on('load', () => {
          mapInstance.addControl(new mapboxgl.NavigationControl());
          map.current = mapInstance;
          setMapInitialized(true);
        });

        // Handle map load error
        mapInstance.on('error', (e) => {
          console.error('Map load error:', e);
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(initializeMap, 2000); // Retry after 2 seconds
          } else {
            toast.error('Impossible de charger la carte. Veuillez réessayer plus tard.');
          }
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(initializeMap, 2000); // Retry after 2 seconds
        } else {
          toast.error('Impossible de charger la carte. Veuillez réessayer plus tard.');
        }
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Charger les données des âmes
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger tous les utilisateurs actifs puis filtrer côté client
        // pour inclure les bergers multi-casquettes
        const shepherdsQuery = query(
          collection(db, 'users'),
          where('status', '==', 'active')
        );

        const shepherdsSnapshot = await getDocs(shepherdsQuery);
        const shepherdsData = shepherdsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(u => isShepherdUser(u));
        setUsers(shepherdsData);

        // Charger les âmes
        let baseQuery = query(
          collection(db, 'souls'),
          where('status', '==', 'active')
        );

        if (selectedShepherdId === 'unassigned') {
          baseQuery = query(
            collection(db, 'souls'),
            where('status', '==', 'active'),
            where('shepherdId', '==', null)
          );
        } else if (selectedShepherdId) {
          baseQuery = query(
            collection(db, 'souls'),
            where('status', '==', 'active'),
            where('shepherdId', '==', selectedShepherdId)
          );
        }

        const soulsSnapshot = await getDocs(baseQuery);
        const soulsData = soulsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Soul[];
        setSouls(soulsData);
        
        // Update stats
        setStats({
          totalSouls: soulsData.length,
          geolocatedSouls: soulsData.filter(s => s.coordinates).length,
          geolocatedShepherds: shepherdsData.filter(s => s.coordinates).length
        });

      } catch (error) {
        console.error('Error loading map data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedShepherdId]);

  // Mettre à jour les marqueurs sur la carte
  useEffect(() => {
    if (!map.current || loading || !mapInitialized) return;

    // Filtrer les âmes et utilisateurs avec des coordonnées valides
    const filteredSouls = souls.filter(soul => 
      soul.coordinates && 
      soul.coordinates.latitude != null &&
      soul.coordinates.longitude != null &&
      !isNaN(soul.coordinates.latitude) &&
      !isNaN(soul.coordinates.longitude)
    );

    const filteredUsers = users.filter(user =>
      user.coordinates &&
      user.coordinates.latitude != null &&
      user.coordinates.longitude != null &&
      !isNaN(user.coordinates.latitude) &&
      !isNaN(user.coordinates.longitude)
    );
    // Créer les features pour la source GeoJSON
    const soulFeatures = filteredSouls.map(soul => ({
      type: 'Feature' as const,
      properties: {
        id: String(soul.id),
        name: String(soul.fullName),
        nickname: soul.nickname ? String(soul.nickname) : null,
        hasShepherd: !!soul.shepherdId,
        type: 'soul'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          Number(soul.coordinates!.longitude),
          Number(soul.coordinates!.latitude)
        ]
      }
    }));

    const userFeatures = filteredUsers.map(user => ({
      type: 'Feature' as const,
      properties: {
        id: String(user.id),
        name: String(user.fullName),
        nickname: user.nickname ? String(user.nickname) : null,
        type: 'shepherd'
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [
          Number(user.coordinates!.longitude),
          Number(user.coordinates!.latitude)
        ]
      }
    }));

    const features = [...soulFeatures, ...userFeatures];

    // Mettre à jour ou créer la source de données
    if (map.current.getSource('souls')) {
      (map.current.getSource('souls') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features
      });
    } else {
      // Ajouter la source et les couches
      map.current.addSource('souls', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection' as const,
          features: features
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Style des clusters
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'souls',
        filter: ['has', 'point_count'],
        paint: {
          // Couleur des clusters
          'circle-color': [
            'step',
            ['get', 'point_count'],
            'rgba(0, 102, 92, 0.9)', // Petit cluster
            10,
            'rgba(242, 182, 54, 0.9)', // Moyen cluster
            30,
            'rgba(255, 99, 71, 0.9)' // Grand cluster
          ],
          // Taille des clusters
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            25, // Taille de base
            10,
            35, // Taille moyenne
            30,
            45 // Grande taille
          ],
          // Bordure des clusters
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          // Effet de halo
          'circle-blur': 0.1
        }
      });

      // Nombre dans les clusters
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'souls',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Points individuels avec style amélioré
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'souls',
        filter: ['!', ['has', 'point_count']],
        paint: {
          // Couleur du point selon le statut
          'circle-color': [
            'match',
            ['get', 'type'],
            'shepherd', '#FF6B6B', // Berger en rouge
            'soul', [
              'case',
              ['get', 'hasShepherd'],
              '#00665C', // Âme assignée
              '#F2B636' // Âme non assignée
            ],
            '#F2B636' // Couleur par défaut
          ],
          'circle-radius': 12,
          // Double bordure
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          // Effet de halo
          'circle-blur': 0.1,
          // Opacité
          'circle-opacity': 0.9
        }
      });

      // Ajouter les interactions
      map.current.on('click', 'unclustered-point', (e) => {
        const geometry = e.features![0].geometry as GeoJSON.Point;
        const coordinates = geometry.coordinates.slice();
        const properties = e.features![0].properties as {
          name: string;
          nickname: string | null;
          type: 'soul' | 'shepherd';
          hasShepherd: boolean;
        };
        
        // Close the existing popup if it exists
        if (currentPopup.current) {
          currentPopup.current.remove();
        }
        
        // Create new popup
        const popup = new mapboxgl.Popup({
          closeButton: false,
          className: 'custom-popup',
          offset: 15
        });
        
        // Set the popup's position and content
        popup.setLngLat(coordinates as [number, number])
             .setHTML(`
               <div class="p-3 bg-white rounded-lg shadow-lg">
                 <h3 class="font-medium text-gray-900">
                   ${properties.name} ${properties.nickname ? `<span class="text-sm text-gray-500">(${properties.nickname})</span>` : ''}
                 </h3>
                 <p class="text-sm mt-1 ${
                   properties.type === 'shepherd' 
                     ? 'text-red-600' 
                     : properties.hasShepherd 
                       ? 'text-[#00665C]' 
                       : 'text-[#F2B636]'
                 }">
                   ${
                     properties.type === 'shepherd'
                       ? 'Berger(e)'
                       : properties.hasShepherd
                         ? 'Assigné(e)'
                         : 'Non assigné(e)'
                   }
                 </p>
               </div>
             `)
             .addTo(map.current!);
        
        // Store the popup in the ref
        currentPopup.current = popup;
        
        // Add event listener to clear ref when popup is closed
        popup.on('close', () => {
          currentPopup.current = null;
        });
      });

      map.current.on('click', 'clusters', (e) => {
        // Store map reference to a local constant to help TypeScript understand it's not null
        const currentMap = map.current;
        if (!currentMap) return;
        
        if (!map.current) return;
        
        const features = currentMap.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        if (features.length === 0) return;
        
        const clusterId = features[0].properties?.cluster_id;
        if (!clusterId) return;
        
        (currentMap.getSource('souls') as mapboxgl.GeoJSONSource)
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            if (currentMap && features[0]?.geometry && features[0].geometry.type === 'Point') {
              currentMap.easeTo({
                center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
                zoom: zoom
              });
            }
          });
      });

      // Changer le curseur au survol
      map.current.on('mouseenter', 'clusters', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current!.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      
      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    }
  }, [souls, loading, mapInitialized]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {stats.geolocatedSouls} / {stats.totalSouls} âmes géolocalisées
            </span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">
              {stats.geolocatedShepherds} berger(e)s géolocalisé(e)s
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="w-64">
              <ShepherdSelect
        value={selectedShepherdId}
        onChange={(value) => setSelectedShepherdId(value)}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#00665C] ring-2 ring-white shadow-sm" />
            <span className="text-sm text-gray-600">Assignée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#F2B636] ring-2 ring-white shadow-sm" />
            <span className="text-sm text-gray-600">Non assignée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#FF6B6B] ring-2 ring-white shadow-sm" />
            <span className="text-sm text-gray-600">Berger(e)</span>
          </div>
        </div> 
      </div>

      <div 
        ref={mapContainer} 
        className="w-full h-[600px] rounded-lg shadow-lg border border-gray-200"
      />
    </div>
  );
}