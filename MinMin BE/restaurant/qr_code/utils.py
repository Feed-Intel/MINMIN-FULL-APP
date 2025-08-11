import qrcode
import io
from django.core.files.base import ContentFile

def generate_qr_code(url: str, format: str = "PNG"):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format=format)
    buffer.seek(0)
    return ContentFile(buffer.getvalue(), name='qr_code.png')
