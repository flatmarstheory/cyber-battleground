import sys
import requests
import time

user_input = sys.argv[1]
url = 'http://localhost:3000/cmd'

data = {'input': user_input}
resp = requests.post(url, data=data)
print(resp.text)
time.sleep(0.1)  # 100ms delay 