from model.exception import SimardException

class TADCException(SimardException):
    def __init__(self, message):
        super().__init__(message, 500)
