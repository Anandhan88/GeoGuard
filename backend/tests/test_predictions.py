import pytest
from app.models.models import FloodPrediction

@pytest.mark.asyncio
async def test_get_predictions_empty(client):
    response = await client.get("/api/v1/predictions")
    # Redirects/defaults to empty or seeded data depending on session
    assert response.status_code in [200, 307]

@pytest.mark.asyncio
async def test_get_heatmap_data(client):
    response = await client.get("/api/v1/predictions/heatmap/data")
    assert response.status_code == 200
    data = response.json()
    assert "points" in data
    assert "total" in data

@pytest.mark.asyncio
async def test_generate_predictions(client):
    response = await client.post("/api/v1/predictions/generate")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "predictions" in data
