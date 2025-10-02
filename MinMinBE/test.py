from django.core.mail import send_mail

send_mail(
    "Test Subject",
    "Hello This is a test",
    fail_silently=False,
    auth_password="mmwbmidynpfpzity",
    auth_user="feedintel1@gmail.com"
)