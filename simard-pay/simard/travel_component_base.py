from uuid import uuid4
from datetime import datetime
from model import SimardException

class TravelComponentException(SimardException):
    pass

class TravelComponentBase():
    def __init__(self, contact_email, component_type, uuid=None, created_at=None, updated_at=None):
        self.uuid = uuid if uuid else str(uuid4())
        self.created_at = created_at if created_at else datetime.utcnow().timestamp()
        self.updated_at = datetime.utcnow().timestamp()

        self.contact_email = contact_email
        self.component_type = component_type
        self.date_regex_rule = '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
