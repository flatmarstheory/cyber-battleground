import sys
import requests
import time

username = sys.argv[1]
password = sys.argv[2]
url = 'http://localhost:3000/login'

data = {'username': username, 'password': password}
resp = requests.post(url, data=data)
print(resp.text)
time.sleep(0.1)  # 100ms delay 