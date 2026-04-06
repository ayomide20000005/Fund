import requests
import base64
from html2image import Html2Image

hti = Html2Image()

def screenshot_url(url):
    hti.screenshot(url=url, save_as='temp.png')
    with open('temp.png', 'rb') as f:
        return base64.b64encode(f.read()).decode()

def check_phishing(url, colab_url):
    img_b64 = screenshot_url(url)
    response = requests.post(f"{colab_url}/predict", json={"image": img_b64})
    return response.json()

# Example usage
colab_url = "https://your-ngrok-url.ngrok.io"  # replace with your Colab ngrok URL
result = check_phishing("https://example.com", colab_url)
print(result)