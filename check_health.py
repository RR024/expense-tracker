import urllib.request
import json

urls = [
    'http://localhost:8000/',
    'http://localhost:8000/api/transactions/testuser',
    'http://localhost:8001/api/users/health',
]

for url in urls:
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            body = resp.read().decode('utf-8')
            print(url, resp.getcode())
            # Print first 400 chars for brevity
            print(body[:400])
    except Exception as e:
        print(url, 'ERROR', e)
