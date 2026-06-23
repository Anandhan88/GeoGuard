"""
GeoGuard AI - OSM Pathfinding Service (Module 7)
Queries OpenStreetMap Overpass API, constructs a network graph,
and calculates the safest route avoiding flood risk zones using Dijkstra and A*.
"""
import httpx
import math
import heapq
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import FloodPrediction, CitizenReport


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2.0) ** 2
    return R * 2.0 * math.asin(math.sqrt(a))


class OSMRouter:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _fetch_osm_data(self, min_lat: float, min_lng: float, max_lat: float, max_lng: float) -> Dict[str, Any]:
        """Fetch highway network from Overpass API."""
        overpass_query = f"""
        [out:json][timeout:25];
        (
          way["highway"]({min_lat},{min_lng},{max_lat},{max_lng});
        );
        (._;>;);
        out body;
        """
        url = "https://overpass-api.de/api/interpreter"
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {"User-Agent": "GeoGuardAI/1.0"}
            response = await client.post(url, data={"data": overpass_query}, headers=headers)
            if response.status_code == 200:
                return response.json()
            raise Exception(f"Overpass API returned status code {response.status_code}")

    async def _get_risk_points(self) -> List[Dict[str, Any]]:
        """Fetch active flood prediction and block report coordinates to avoid."""
        risk_points = []
        
        # 1. Fetch predictions
        pred_result = await self.db.execute(select(FloodPrediction))
        preds = pred_result.scalars().all()
        # Mock centers for zones to avoid complex polygon overlap checks
        ZONE_CENTERS = {
            "zone-001": (13.0827, 80.2707),
            "zone-002": (10.7905, 78.7047),
            "zone-003": (9.9252, 78.1198),
            "zone-004": (11.0168, 76.9558),
            "zone-005": (8.7139, 77.7567),
        }
        for p in preds:
            if p.risk_score > 40.0:
                coords = ZONE_CENTERS.get(p.zone_id)
                if coords:
                    risk_points.append({
                        "lat": coords[0],
                        "lng": coords[1],
                        "score": p.risk_score,
                        "radius_km": 1.5 if p.risk_score > 75 else 0.8
                    })
                    
        # 2. Fetch blocked roads reports
        report_result = await self.db.execute(select(CitizenReport).filter(CitizenReport.type.in_(["blocked_road", "flood"])))
        reports = report_result.scalars().all()
        for r in reports:
            r_lat = r.latitude if hasattr(r, 'latitude') and r.latitude is not None else None
            r_lng = r.longitude if hasattr(r, 'longitude') and r.longitude is not None else None
            if r_lat and r_lng:
                risk_points.append({
                    "lat": r_lat,
                    "lng": r_lng,
                    "score": 100.0 if r.verified else 70.0,
                    "radius_km": 0.3
                })
                
        return risk_points

    def _calculate_edge_risk_penalty(self, lat: float, lng: float, risk_points: List[Dict[str, Any]]) -> float:
        """Calculates a cost multiplier based on proximity to flood/blockage risk points."""
        multiplier = 1.0
        for rp in risk_points:
            dist = haversine(lat, lng, rp["lat"], rp["lng"])
            if dist < rp["radius_km"]:
                # Scale penalty by closeness and risk severity
                proximity_factor = 1.0 - (dist / rp["radius_km"])
                # Max penalty adds up to 15x cost multiplier for critical zones
                multiplier += (rp["score"] / 10.0) * proximity_factor
        return multiplier

    async def generate_safe_route(
        self, 
        origin: Tuple[float, float], 
        destination: Tuple[float, float], 
        algorithm: str = "A*"
    ) -> Dict[str, Any]:
        """
        Generates the safest route avoiding high-risk flood zones.
        Returns GeoJSON coordinates, distance, estimated time, and warnings.
        """
        orig_lat, orig_lng = origin
        dest_lat, dest_lng = destination
        
        # 1. Fetch risk points from DB
        risk_points = await self._get_risk_points()
        
        # 2. Setup bounding box around origin/destination with 2km padding
        min_lat = min(orig_lat, dest_lat) - 0.02
        max_lat = max(orig_lat, dest_lat) + 0.02
        min_lng = min(orig_lng, dest_lng) - 0.02
        max_lng = max(orig_lng, dest_lng) + 0.02
        
        try:
            osm_data = await self._fetch_osm_data(min_lat, min_lng, max_lat, max_lng)
        except Exception as e:
            print(f"OSMRouter: OSM fetch failed ({e}). Falling back to local grid pathfinding.")
            return self._generate_fallback_route(origin, destination, risk_points)
            
        # 3. Parse OSM nodes and ways
        nodes = {}
        for elem in osm_data.get("elements", []):
            if elem["type"] == "node":
                nodes[elem["id"]] = (elem["lat"], elem["lon"])
                
        # Build adjacency list
        graph = {}
        for elem in osm_data.get("elements", []):
            if elem["type"] == "way" and "nodes" in elem:
                way_nodes = elem["nodes"]
                # Connect nodes sequentially
                for j in range(len(way_nodes) - 1):
                    u, v = way_nodes[j], way_nodes[j+1]
                    if u in nodes and v in nodes:
                        # Edge weight calculations
                        u_lat, u_lng = nodes[u]
                        v_lat, v_lng = nodes[v]
                        dist = haversine(u_lat, u_lng, v_lat, v_lng)
                        
                        # Apply risk penalties
                        u_risk = self._calculate_edge_risk_penalty(u_lat, u_lng, risk_points)
                        v_risk = self._calculate_edge_risk_penalty(v_lat, v_lng, risk_points)
                        avg_risk_multiplier = (u_risk + v_risk) / 2.0
                        
                        cost = dist * avg_risk_multiplier
                        
                        if u not in graph:
                            graph[u] = []
                        if v not in graph:
                            graph[v] = []
                            
                        # Bidirectional roads by default
                        graph[u].append((v, cost, dist))
                        graph[v].append((u, cost, dist))
                        
        if not graph:
            return self._generate_fallback_route(origin, destination, risk_points)
            
        # 4. Find closest OSM nodes to origin and destination coordinates
        def find_nearest_node(lat: float, lng: float) -> int:
            best_node = None
            best_dist = float("inf")
            for nid, (nlat, nlng) in nodes.items():
                if nid in graph:
                    d = haversine(lat, lng, nlat, nlng)
                    if d < best_dist:
                        best_dist = d
                        best_node = nid
            return best_node

        start_node = find_nearest_node(orig_lat, orig_lng)
        end_node = find_nearest_node(dest_lat, dest_lng)
        
        if start_node is None or end_node is None:
            return self._generate_fallback_route(origin, destination, risk_points)
            
        # 5. Execute Pathfinding (Dijkstra or A*)
        # queue elements: (f_score, current_node, g_score, path_list, accum_dist)
        queue = []
        
        # heuristic for A*
        h_score = haversine(nodes[start_node][0], nodes[start_node][1], dest_lat, dest_lng) if algorithm == "A*" else 0.0
        heapq.heappush(queue, (h_score, start_node, 0.0, [start_node], 0.0))
        
        visited = {}
        best_path = None
        best_dist = 0.0
        
        while queue:
            f, u, g, path, d_acc = heapq.heappop(queue)
            
            if u in visited and visited[u] <= g:
                continue
            visited[u] = g
            
            if u == end_node:
                best_path = path
                best_dist = d_acc
                break
                
            for v, cost, edge_dist in graph.get(u, []):
                new_g = g + cost
                if v not in visited or visited[v] > new_g:
                    new_h = haversine(nodes[v][0], nodes[v][1], dest_lat, dest_lng) if algorithm == "A*" else 0.0
                    new_f = new_g + new_h
                    heapq.heappush(queue, (new_f, v, new_g, path + [v], d_acc + edge_dist))
                    
        if best_path is None:
            return self._generate_fallback_route(origin, destination, risk_points)
            
        # 6. Assemble output
        waypoints = [{"lat": nodes[nid][0], "lng": nodes[nid][1]} for nid in best_path]
        
        # Calculate risk along route
        max_multiplier = 1.0
        for wp in waypoints:
            risk_mult = self._calculate_edge_risk_penalty(wp["lat"], wp["lng"], risk_points)
            if risk_mult > max_multiplier:
                max_multiplier = risk_mult
                
        risk_percentage = min(99, int((max_multiplier - 1.0) * 10))
        
        # Estimate walking speed of 5 km/hr with penalty
        est_time_mins = round((best_dist / 5.0) * 60.0 * (1.0 + risk_percentage / 100.0))
        
        return {
            "origin": {"lat": orig_lat, "lng": orig_lng},
            "destination": {"lat": dest_lat, "lng": dest_lng},
            "waypoints": waypoints,
            "distance_km": round(best_dist, 2),
            "estimated_time_min": max(2, est_time_mins),
            "risk_along_route": risk_percentage,
            "algorithm": f"{algorithm} on live OSM network",
            "avoided_zones": [rp for rp in risk_points if self._is_near_route(rp, waypoints)],
            "road_conditions": "Safe routes active. High flood areas penalized." if risk_percentage < 30 else "Caution: Route passes near waterlogged sectors."
        }

    def _is_near_route(self, rp: Dict[str, Any], waypoints: List[Dict[str, Any]]) -> bool:
        for wp in waypoints:
            if haversine(wp["lat"], wp["lng"], rp["lat"], rp["lng"]) < 0.4:
                return True
        return False

    def _generate_fallback_route(
        self, 
        origin: Tuple[float, float], 
        destination: Tuple[float, float], 
        risk_points: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Local straight-line/grid route fallback generator if OSM is unreachable."""
        orig_lat, orig_lng = origin
        dest_lat, dest_lng = destination
        
        dist = haversine(orig_lat, orig_lng, dest_lat, dest_lng)
        
        # Generate artificial grid points
        waypoints = [
            {"lat": orig_lat, "lng": orig_lng},
            {"lat": orig_lat + (dest_lat - orig_lat) * 0.33 + 0.001, "lng": orig_lng + (dest_lng - orig_lng) * 0.33},
            {"lat": orig_lat + (dest_lat - orig_lat) * 0.66, "lng": orig_lng + (dest_lng - orig_lng) * 0.66 + 0.001},
            {"lat": dest_lat, "lng": dest_lng}
        ]
        
        # Calculate risk along fallback
        max_multiplier = 1.0
        for wp in waypoints:
            risk_mult = self._calculate_edge_risk_penalty(wp["lat"], wp["lng"], risk_points)
            if risk_mult > max_multiplier:
                max_multiplier = risk_mult
                
        risk_percentage = min(99, int((max_multiplier - 1.0) * 10))
        est_time_mins = round((dist / 5.0) * 60.0 * (1.0 + risk_percentage / 100.0))
        
        return {
            "origin": {"lat": orig_lat, "lng": orig_lng},
            "destination": {"lat": dest_lat, "lng": dest_lng},
            "waypoints": waypoints,
            "distance_km": round(dist * 1.15, 2), # factor in grid layout
            "estimated_time_min": max(3, est_time_mins),
            "risk_along_route": risk_percentage,
            "algorithm": "Heuristic Grid Pathfinder (OSM Fallback)",
            "avoided_zones": [],
            "road_conditions": "Local route generated. Safe pathfinding fallback enabled."
        }
