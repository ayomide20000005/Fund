import requests

serveo_url = "https://5d825f87772e7e0b-35-198-212-86.serveousercontent.com"  # use your actual URL from Colab
try:
    response = requests.post(f"{serveo_url}/predict", json={"test": "hello"}, timeout=5)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)