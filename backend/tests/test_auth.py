"""
Tests for authentication and profile management endpoints.
"""
import pytest


@pytest.mark.asyncio
async def test_register_new_user(client):
    """Test registering a new user."""
    response = await client.post("/api/v1/auth/register", json={
        "email": "testuser@geoguard.ai",
        "password": "testpass123",
        "name": "Test User",
        "role": "citizen",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "testuser@geoguard.ai"
    assert data["user"]["name"] == "Test User"
    assert data["user"]["role"] == "citizen"


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """Test that registering with an existing email fails."""
    user_data = {
        "email": "duplicate@geoguard.ai",
        "password": "testpass123",
        "name": "First User",
        "role": "citizen",
    }
    # First registration should succeed
    resp1 = await client.post("/api/v1/auth/register", json=user_data)
    assert resp1.status_code == 201

    # Second registration with same email should fail
    resp2 = await client.post("/api/v1/auth/register", json=user_data)
    assert resp2.status_code == 400
    assert "already registered" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_valid_credentials(client):
    """Test logging in with valid credentials."""
    # Register first
    await client.post("/api/v1/auth/register", json={
        "email": "logintest@geoguard.ai",
        "password": "mypassword",
        "name": "Login Tester",
        "role": "citizen",
    })

    # Login
    response = await client.post("/api/v1/auth/login", json={
        "email": "logintest@geoguard.ai",
        "password": "mypassword",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "logintest@geoguard.ai"


@pytest.mark.asyncio
async def test_login_invalid_password(client):
    """Test that login with wrong password returns 401."""
    await client.post("/api/v1/auth/register", json={
        "email": "badpw@geoguard.ai",
        "password": "correctpassword",
        "name": "Bad PW User",
        "role": "citizen",
    })

    response = await client.post("/api/v1/auth/login", json={
        "email": "badpw@geoguard.ai",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_profile(client):
    """Test fetching the current user's profile."""
    # Register and get token
    reg = await client.post("/api/v1/auth/register", json={
        "email": "profileget@geoguard.ai",
        "password": "pass123",
        "name": "Profile Getter",
        "role": "authority",
        "language_pref": "ta",
    })
    token = reg.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profileget@geoguard.ai"
    assert data["name"] == "Profile Getter"
    assert data["role"] == "authority"
    assert data["language_pref"] == "ta"


@pytest.mark.asyncio
async def test_update_profile_name_and_phone(client):
    """Test updating name and phone via PUT /me."""
    reg = await client.post("/api/v1/auth/register", json={
        "email": "updatetest@geoguard.ai",
        "password": "pass123",
        "name": "Original Name",
        "role": "citizen",
    })
    token = reg.json()["access_token"]

    response = await client.put(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated Name", "phone": "+91-9999999999"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["phone"] == "+91-9999999999"


@pytest.mark.asyncio
async def test_update_profile_language(client):
    """Test updating language preference via PUT /me."""
    reg = await client.post("/api/v1/auth/register", json={
        "email": "langtest@geoguard.ai",
        "password": "pass123",
        "name": "Lang Tester",
        "role": "citizen",
    })
    token = reg.json()["access_token"]

    # Update to Tamil
    response = await client.put(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"language_pref": "ta"},
    )
    assert response.status_code == 200
    assert response.json()["language_pref"] == "ta"

    # Update to Hindi
    response = await client.put(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"language_pref": "hi"},
    )
    assert response.status_code == 200
    assert response.json()["language_pref"] == "hi"

    # Verify persisted via GET /me
    profile = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile.json()["language_pref"] == "hi"


@pytest.mark.asyncio
async def test_update_profile_invalid_language(client):
    """Test that an invalid language preference returns 400."""
    reg = await client.post("/api/v1/auth/register", json={
        "email": "invalidlang@geoguard.ai",
        "password": "pass123",
        "name": "Invalid Lang",
        "role": "citizen",
    })
    token = reg.json()["access_token"]

    response = await client.put(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"language_pref": "fr"},
    )
    assert response.status_code == 400
    assert "invalid language" in response.json()["detail"].lower()
