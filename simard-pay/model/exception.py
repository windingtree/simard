"""
Define a custome exception scheme
- It includes an code to be used for HTTP answers
"""
from werkzeug.exceptions import HTTPException

class SimardException(HTTPException):
    def __init__(self, message, code):
        super().__init__(description=message)
        self.code = code

    @staticmethod
    def check_mandatory_keys(mandatory_keys, received_keys):
        for key in mandatory_keys:
            if key not in received_keys:
                raise SimardException(
                    'Missing mandatory key in parameters: %s' % key,
                    400
                )
