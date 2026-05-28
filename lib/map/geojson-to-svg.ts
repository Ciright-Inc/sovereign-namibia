export type GeoJSONGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type GeoJSONFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: GeoJSONGeometry;
};

export type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

type Project = (lon: number, lat: number) => { x: number; y: number };

export function createEquirectangularProjector(bounds: {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  width: number;
  height: number;
}) {
  const { minLon, minLat, maxLon, maxLat, width, height } = bounds;
  const dx = maxLon - minLon || 1;
  const dy = maxLat - minLat || 1;

  const project: Project = (lon, lat) => {
    const x = ((lon - minLon) / dx) * width;
    // SVG y goes down, lat increases north
    const y = ((maxLat - lat) / dy) * height;
    return { x, y };
  };
  return { project };
}

export function computeFeatureCollectionBounds(fc: GeoJSONFeatureCollection) {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  const visit = (lon: number, lat: number) => {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };

  for (const f of fc.features) {
    const g = f.geometry;
    if (g.type === "Polygon") {
      for (const ring of g.coordinates) for (const [lon, lat] of ring) visit(lon, lat);
    } else {
      for (const poly of g.coordinates) for (const ring of poly) for (const [lon, lat] of ring) visit(lon, lat);
    }
  }
  return { minLon, minLat, maxLon, maxLat };
}

export function geometryToPath(geom: GeoJSONGeometry, project: Project) {
  const parts: string[] = [];
  const ringTo = (ring: number[][]) => {
    if (ring.length === 0) return;
    const [lon0, lat0] = ring[0];
    const p0 = project(lon0, lat0);
    parts.push(`M${p0.x.toFixed(2)},${p0.y.toFixed(2)}`);
    for (let i = 1; i < ring.length; i++) {
      const [lon, lat] = ring[i];
      const p = project(lon, lat);
      parts.push(`L${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    }
    parts.push("Z");
  };

  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) ringTo(ring);
  } else {
    for (const poly of geom.coordinates) for (const ring of poly) ringTo(ring);
  }
  return parts.join(" ");
}

