import sys
import requests
import time

username = sys.argv[1]
payload = sys.argv[2]
url = 'http://localhost:3000/comment'

data = {'username': username, 'comment': payload}
resp = requests.post(url, data=data)
print('Payload submitted. Check /comments.html to see if it executed.')
time.sleep(0.1)  # 100ms delay 