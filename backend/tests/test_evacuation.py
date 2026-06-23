import pytest
from unittest.mock import patch
from app.models.models import Shelter

@pytest.mark.asyncio
async def test_get_evacuation_routes(client, db_session):
    # Seed top 2 shelters
    shelter1 = Shelter(
        id="001",
        name="Anna University Convention Centre",
        latitude=13.0127,
        longitude=80.2352,
        capacity=500,
        current_occupancy=187,
        address="Chennai"
    )
    shelter2 = Shelter(
        id="002",
        name="YMCA Nandanam Sports Complex",
        latitude=13.0300,
        longitude=80.2400,
        capacity=300,
        current_occupancy=245,
        address="Chennai"
    )
    db_session.add(shelter1)
    db_session.add(shelter2)
    await db_session.commit()

    params = {
        "origin_lat": 12.9815,
        "origin_lng": 80.2180,
    }
    
    with patch("app.services.routing_service.OSMRouter.generate_safe_route") as mock_route:
        # Mock generate_safe_route to return route data depending on the destination coordinates
        async def side_effect(origin, destination, algorithm="A*"):
            if destination == (13.0127, 80.2352):
                return {
                    "origin": {"lat": origin[0], "lng": origin[1]},
                    "destination": {"lat": destination[0], "lng": destination[1]},
                    "waypoints": [{"lat": 12.9870, "lng": 80.2225}],
                    "distance_km": 2.8,
                    "estimated_time_min": 15,
                    "risk_along_route": 25,
                    "algorithm": "A*",
                    "avoided_zones": [],
                    "road_conditions": "Safe"
                }
            else:
                return {
                    "origin": {"lat": origin[0], "lng": origin[1]},
                    "destination": {"lat": destination[0], "lng": destination[1]},
                    "waypoints": [{"lat": 12.9870, "lng": 80.2225}],
                    "distance_km": 6.5,
                    "estimated_time_min": 35,
                    "risk_along_route": 42,
                    "algorithm": "A*",
                    "avoided_zones": [],
                    "road_conditions": "Heavy traffic"
                }
        mock_route.side_effect = side_effect

        response = await client.get("/api/v1/evacuation/routes", params=params)
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
        assert "total" in data
        assert len(data["routes"]) == 2
        
        # Check that Route 2 has the updated coordinates
        route2 = next((r for r in data["routes"] if r["id"] == "route-002"), None)
        assert route2 is not None
        assert route2["origin"] == {"lat": 12.9815, "lng": 80.2180}
        assert route2["destination"] == {"lat": 13.0300, "lng": 80.2400}
        # First waypoint should be Phoenix Marketcity area
        assert route2["waypoints"][0] == {"lat": 12.9870, "lng": 80.2225}

@pytest.mark.asyncio
async def test_generate_evacuation_route(client, db_session):
    shelter = Shelter(
        id="001",
        name="Anna University Convention Centre",
        latitude=13.0127,
        longitude=80.2352,
        capacity=500,
        current_occupancy=187,
        address="Chennai"
    )
    db_session.add(shelter)
    await db_session.commit()

    params = {
        "origin_lat": 12.9815,
        "origin_lng": 80.2180,
    }
    with patch("app.services.routing_service.OSMRouter.generate_safe_route") as mock_route:
        mock_route.return_value = {
            "origin": {"lat": 12.9815, "lng": 80.2180},
            "destination": {"lat": 13.0127, "lng": 80.2352},
            "waypoints": [{"lat": 12.9870, "lng": 80.2225}],
            "distance_km": 2.8,
            "estimated_time_min": 15,
            "risk_along_route": 25,
            "algorithm": "A*",
            "avoided_zones": [],
            "road_conditions": "Safe"
        }
        response = await client.post("/api/v1/evacuation/route", params=params)
        assert response.status_code == 200
        data = response.json()
        assert "waypoints" in data
        assert "distance_km" in data
        assert data["shelter_name"] == "Anna University Convention Centre"

