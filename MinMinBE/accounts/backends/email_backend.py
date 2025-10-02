# import ssl
# from django.core.mail.backends.smtp import EmailBackend as SMTPBackend
# from django.utils.functional import cached_property

# class EmailBackend(SMTPBackend):
#     @cached_property
#     def ssl_context(self):
#         if self.ssl_certfile or self.ssl_keyfile:
#             ssl_context = ssl.SSLContext(protocol=ssl.PROTOCOL_TLS_CLIENT)
#             ssl_context.load_cert_chain(self.ssl_certfile,self.ssl_keyfile)
#             return ssl_context
#         else:
#             ssl_context = ssl.create_default_context()
#             ssl_context.check_hostname = False
#             ssl_context.verify_mode = ssl.CERT_NONE
#             return ssl_context

import ssl
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend
from django.utils.functional import cached_property

class EmailBackend(SMTPBackend):
    @cached_property
    def ssl_context(self):
        # Use a secure, default SSL context if no custom certificate is specified.
        # This will perform all necessary hostname and certificate verification.
        if self.ssl_certfile or self.ssl_keyfile:
            ssl_context = ssl.SSLContext(protocol=ssl.PROTOCOL_TLS_CLIENT)
            ssl_context.load_cert_chain(self.ssl_certfile, self.ssl_keyfile)
            return ssl_context
        else:
            return ssl.create_default_context()