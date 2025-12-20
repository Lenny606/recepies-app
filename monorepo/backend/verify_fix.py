import requests

BASE_URL = "http://localhost:8000/api/v1/recipes"
RECIPE_ID = "694469ee91ec7ff23d912174"

def test_recipe_detail_no_auth():
    print(f"Testing GET {BASE_URL}/{RECIPE_ID} without token...")
    response = requests.get(f"{BASE_URL}/{RECIPE_ID}")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success: Recipe detail accessible without auth.")
    else:
        print(f"Failure: Received status {response.status_code}")
        print(response.json())

if __name__ == "__main__":
    test_recipe_detail_no_auth()
