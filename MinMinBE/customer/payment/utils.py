import requests
      
url = "https://api.chapa.co/v1/transaction/initialize"


url_verify = 'https://api.chapa.co/v1/transaction/verify/'

def verify_payment(payment_id,API_KEY):
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    response = requests.get(url_verify+payment_id, headers=headers, data='')
    data = response.json()
    return data