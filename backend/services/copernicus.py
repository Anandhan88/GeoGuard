import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from services.auth import auth_service

ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"

def get_bbox_polygon_wkt(lat: float, lng: float, offset: float = 0.05) -> str:
    """Helper to construct WKT POLYGON for bounding box around coordinate."""
    min_lng, max_lng = lng - offset, lng + offset
    min_lat, max_lat = lat - offset, lat + offset
    # Note: polygon vertices must be clockwise/counter-clockwise and closed
    return f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"

def format_wkt_bbox(bbox: List[float]) -> str:
    """Helper to convert [min_lat, min_lng, max_lat, max_lng] to WKT POLYGON."""
    # bbox format: [min_lat, min_lng, max_lat, max_lng]
    min_lat, min_lng, max_lat, max_lng = bbox[0], bbox[1], bbox[2], bbox[3]
    return f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"

class CopernicusCatalogueService:
    def search_products(
        self,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        bbox: Optional[List[float]] = None,
        date_str: Optional[str] = None,
        satellite_type: str = "Sentinel-1",
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for Sentinel-1/Sentinel-2 products.
        If credentials are not set, returns simulated data.
        """
        token = auth_service.get_token()
        
        # If no credentials, generate mock/simulated products
        if not token:
            return self._generate_simulated_products(lat, lng, bbox, date_str, satellite_type, limit)

        # Build $filter query
        filters = []
        
        # Collection filter
        collection = "SENTINEL-1" if "1" in satellite_type else "SENTINEL-2"
        filters.append(f"Collection/Name eq '{collection}'")
        
        # GRD product type for Sentinel-1 (standard for flood maps)
        if collection == "SENTINEL-1":
            filters.append("contains(Name,'IW_GRDH')")
        else:
            # L2A (Bottom of Atmosphere) for Sentinel-2
            filters.append("contains(Name,'MSIL2A')")

        # Spatial filter (geometry intersects query polygon)
        geometry_wkt = None
        if bbox and len(bbox) == 4:
            geometry_wkt = format_wkt_bbox(bbox)
        elif lat is not None and lng is not None:
            geometry_wkt = get_bbox_polygon_wkt(lat, lng)

        if geometry_wkt:
            filters.append(f"OData.CSC.Intersects(area=geography'SRID=4326;{geometry_wkt}')")

        # Temporal filter
        if date_str:
            try:
                target_date = datetime.fromisoformat(date_str.replace("Z", ""))
            except ValueError:
                target_date = datetime.utcnow()
        else:
            target_date = datetime.utcnow()
            
        start_date = (target_date - timedelta(days=10)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        end_date = target_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        
        filters.append(f"ContentDate/Start ge {start_date} and ContentDate/Start le {end_date}")

        # Assemble the full URL
        filter_str = " and ".join(filters)
        params = {
            "$filter": filter_str,
            "$orderby": "ContentDate/Start desc",
            "$top": limit,
            "$select": "Id,Name,ContentDate,Footprint"
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        try:
            print(f"Copernicus Catalog: Searching CDSE with params: {params}")
            response = requests.get(ODATA_URL, params=params, headers=headers, timeout=20)
            response.raise_for_status()
            
            data = response.json()
            products = data.get("value", [])
            
            result = []
            for p in products:
                prod_id = p.get("Id")
                name = p.get("Name")
                content_date = p.get("ContentDate", {}).get("Start")
                footprint = p.get("Footprint")
                
                # Derive attributes
                orbit = "Descending" if "D" in name.split("_")[-1] else "Ascending"
                
                result.append({
                    "productId": prod_id,
                    "acquisitionTime": content_date,
                    "satelliteName": satellite_type,
                    "productName": name,
                    "orbit": orbit,
                    "footprint": footprint,
                    "downloadUrl": f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products({prod_id})/$value"
                })
            
            # If no actual products are found, return mock values so map renders
            if not result:
                print("Copernicus Catalog: No real assets found. Returning simulation.")
                return self._generate_simulated_products(lat, lng, bbox, date_str, satellite_type, limit)

            return result
            
        except Exception as e:
            print(f"Copernicus Catalogue search failed: {e}. Falling back to simulation.")
            return self._generate_simulated_products(lat, lng, bbox, date_str, satellite_type, limit)

    def _generate_simulated_products(
        self,
        lat: Optional[float],
        lng: Optional[float],
        bbox: Optional[List[float]],
        date_str: Optional[str],
        satellite_type: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Fallback simulated product metadata generator."""
        lat = lat or 13.0827
        lng = lng or 80.2707
        
        products = []
        collection = "SENTINEL-1" if "1" in satellite_type else "SENTINEL-2"
        
        # Generate 3 simulated assets from last few days
        for i in range(limit):
            dt = datetime.utcnow() - timedelta(days=i * 2, hours=i * 5)
            prod_id = f"simulated-uuid-asset-{collection.lower()}-{i}"
            
            # Create a realistic name
            mode = "IW_GRDH" if collection == "SENTINEL-1" else "MSIL2A"
            time_str = dt.strftime("%Y%m%dT%H%M%S")
            name = f"S1A_{mode}_1SDV_{time_str}_{time_str}_048740_05DC1C_D68E"
            
            # Approximate footprint
            min_lng, max_lng = lng - 0.5, lng + 0.5
            min_lat, max_lat = lat - 0.5, lat + 0.5
            footprint_wkt = f"geography'SRID=4326;POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))'"
            
            products.append({
                "productId": prod_id,
                "acquisitionTime": dt.isoformat() + "Z",
                "satelliteName": f"{satellite_type} (Simulated)",
                "productName": name,
                "orbit": "Descending" if i % 2 == 0 else "Ascending",
                "footprint": footprint_wkt,
                "downloadUrl": f"http://localhost:8000/api/satellite/image?productId={prod_id}"
            })
            
        return products

# Singleton instance
catalogue_service = CopernicusCatalogueService()
