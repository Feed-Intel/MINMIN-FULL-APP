def save_user_profile(backend, user, response, *args, **kwargs):
    if backend.name == 'google-oauth2':
        user.full_name = response.get('name', user.name)
        user.email = response.get('email', user.email)
        user.save()
