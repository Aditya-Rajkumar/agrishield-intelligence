export type GibsLayerType = 'NDVI' | 'SMAP_SOIL_MOISTURE' | 'TRUE_COLOR';

export interface GibsLayerConfig {
  id: string;
  name: string;
  layerIdentifier: string;
  tileMatrixSet: string;
  format: string;
  description: string;
}

export const NASA_GIBS_LAYERS: Record<GibsLayerType, GibsLayerConfig> = {
  NDVI: {
    id: 'NDVI',
    name: 'MODIS Vegetation Health (NDVI)',
    layerIdentifier: 'MODIS_Terra_NDVI_8Day',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    description: '8-day composite Normalized Difference Vegetation Index measuring canopy chlorophyll density.',
  },
  SMAP_SOIL_MOISTURE: {
    id: 'SMAP_SOIL_MOISTURE',
    name: 'NASA SMAP Root-Zone Soil Moisture',
    layerIdentifier: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    description: 'Surface and root-zone soil moisture anomaly derived from L-band radiometer observations.',
  },
  TRUE_COLOR: {
    id: 'TRUE_COLOR',
    name: 'VIIRS Corrected Reflectance',
    layerIdentifier: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    description: 'Near real-time orbital true-color surface imagery.',
  },
};

/**
 * Generates a WMTS tile URL template compatible with Leaflet/Mapbox for a specific date (YYYY-MM-DD).
 */
export function getGibsTileUrl(layerType: GibsLayerType, dateStr: string): string {
  const config = NASA_GIBS_LAYERS[layerType];
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${config.layerIdentifier}/default/${dateStr}/${config.tileMatrixSet}/{z}/{y}/{x}.${config.format}`;
}

/**
 * Computes NDWI (Normalized Difference Water Index) from NIR and SWIR reflectance bands.
 */
export function calculateNDWI(nirBand: number, swirBand: number): {
  ndwi: number;
  waterStressLevel: 'Well-Hydrated' | 'Moderate Moisture Deficit' | 'Severe Canopy Water Stress';
} {
  const denominator = nirBand + swirBand;
  const ndwi = denominator === 0 ? 0 : Number(((nirBand - swirBand) / denominator).toFixed(3));

  let waterStressLevel: 'Well-Hydrated' | 'Moderate Moisture Deficit' | 'Severe Canopy Water Stress' = 'Well-Hydrated';
  if (ndwi < 0.0) {
    waterStressLevel = 'Severe Canopy Water Stress';
  } else if (ndwi < 0.2) {
    waterStressLevel = 'Moderate Moisture Deficit';
  }

  return { ndwi, waterStressLevel };
}