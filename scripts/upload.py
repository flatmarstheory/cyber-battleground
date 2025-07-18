import sys
import requests
import time

file_path = sys.argv[1]
filename = sys.argv[2]
url = 'http://localhost:3000/upload'

with open(file_path, 'rb') as f:
    files = {'file': (filename, f)}
    resp = requests.post(url, files=files)
    print(resp.text)
time.sleep(0.1)  # 100ms delay 