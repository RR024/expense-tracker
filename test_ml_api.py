import requests
import json

try:
    # Test the ML API
    response = requests.get('http://localhost:5000/api/ml/analyze/Ram')
    print(f'Status Code: {response.status_code}')
    print('\nResponse Data:')
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f'Error: {e}')
