import pytest

@pytest.mark.asyncio
async def test_get_evacuation_routes(client):
    response = await client.get("/api/v1/evacuation/routes")
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
async def test_generate_evacuation_route(client):
    params = {
        "origin_lat": 12.9815,
        "origin_lng": 80.2180,
    }
    response = await client.post("/api/v1/evacuation/route", params=params)
    assert response.status_code == 200
    data = response.json()
    assert "route" in data
    assert "message" in data
    assert data["route"]["id"] == "route-001"
