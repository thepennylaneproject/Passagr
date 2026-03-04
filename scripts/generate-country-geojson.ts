import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve('data');
const GEOJSON_TEMP = path.join(DATA_DIR, 'ne_admin_0_countries.geojson');
const OUTPUT_GEOJSON = path.resolve('public', 'countries.geojson');
const CANDIDATES = [
    {
        name: '10m',
        shapefile: path.join(DATA_DIR, 'ne_10m_admin_0_countries', 'ne_10m_admin_0_countries.shp')
    },
    {
        name: '50m',
        shapefile: path.join(DATA_DIR, 'ne_50m_admin_0_countries', 'ne_50m_admin_0_countries.shp')
    }
];

const ensureDir = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const locateNaturalEarthSource = () => {
    for (const candidate of CANDIDATES) {
        if (fs.existsSync(candidate.shapefile)) {
            console.log(`Using existing shapefile (${candidate.name}) at ${candidate.shapefile}`);
            return candidate.shapefile;
        }
    }
    throw new Error('No Natural Earth shapefile found under data/. Place the downloaded archive there.');
};

const convertToGeojson = (source: string) => {
    if (fs.existsSync(GEOJSON_TEMP)) return GEOJSON_TEMP;
    console.log('Converting Natural Earth shapefile to GeoJSON using mapshaper...');
    const mapshaperBinary = path.resolve('node_modules', '.bin', 'mapshaper');
    if (!fs.existsSync(mapshaperBinary)) {
        throw new Error('mapshaper binary is missing. Run npm install first.');
    }
    execFileSync(mapshaperBinary, [source, '-o', 'format=geojson', GEOJSON_TEMP], { stdio: 'inherit' });
    return GEOJSON_TEMP;
};

const loadNaturalEarth = (geojsonPath: string) => {
    const contents = fs.readFileSync(geojsonPath, 'utf-8');
    return JSON.parse(contents);
};

const buildGeojson = () => {
    ensureDir(DATA_DIR);
    ensureDir(path.dirname(OUTPUT_GEOJSON));

    const source = locateNaturalEarthSource();
    const geojsonPath = convertToGeojson(source);

    const naturalEarth = loadNaturalEarth(geojsonPath);
    if (!naturalEarth?.features) {
        throw new Error('Unexpected Natural Earth GeoJSON structure.');
    }

    const features = naturalEarth.features.map((feature: any) => {
        const iso2 = (feature?.properties?.ISO_A2 || '').toString().toUpperCase();
        return {
            type: 'Feature',
            geometry: feature.geometry,
            properties: {
                name: feature?.properties?.ADMIN || iso2,
                iso2,
                pathways: []
            }
        };
    });

    const output = {
        type: 'FeatureCollection',
        features
    };

    fs.writeFileSync(OUTPUT_GEOJSON, JSON.stringify(output, undefined, 2));
    console.log(`Generated ${OUTPUT_GEOJSON} with ${features.length} features.`);
};

(() => {
    try {
        buildGeojson();
    } catch (error) {
        console.error('GeoJSON generation failed:', error);
        process.exit(1);
    }
})();
