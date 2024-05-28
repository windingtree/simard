from .exception import SimardException
import re

REGEXP_TEXT = r'^[-A-Za-z0-9]+$'

REGEXP_NAME = r'^[- A-Za-z]+$'


class CustomerReferenceException(SimardException):
    pass

REGEXPS = {
    'costCenter': REGEXP_TEXT,
    'businessUnit': r'^[- A-Zz-z0-9]+$',
    'projectCode': REGEXP_TEXT,
    'jobNumber': REGEXP_TEXT,
    'employeeId': REGEXP_TEXT,
    'travellerType': REGEXP_TEXT,
    'travellerLastName': REGEXP_NAME,
    'travellerFirstName': REGEXP_NAME,
    'approverLastName': REGEXP_NAME,
    'approverFirstName': REGEXP_NAME,
}

MANDATORY_KEYS = [
    'travellerLastName',
    'travellerFirstName'
]

TADC_KEYS = [
    'costCenter',
    'businessUnit',
    'projectCode',
    'jobNumber',
    'employeeId',
    'travellerType',
    'approverLastName',
]

class CustomerReferences(object):
    def __init__(self, customer_references: dict):
        # Check Mandatory keys
        CustomerReferenceException.check_mandatory_keys(MANDATORY_KEYS, customer_references)

        # FIXME - Remove bypass after cleaning DB
        if 'costCentre' in customer_references:
            customer_references['costCenter'] = customer_references['costCentre']
            del customer_references['costCentre']

        # Validate References
        for field in customer_references:
            if field in REGEXPS:
                if not re.match(REGEXPS[field], customer_references[field]):
                    raise CustomerReferenceException(
                        "Invalid customer reference: '%s'" % field,
                        400
                    )

            else:
                raise CustomerReferenceException(
                    "Unexpected customer reference: '%s'" % field,
                    400
                )

        self._customer_references = customer_references

    def has_tadc_references(self):
        for key in TADC_KEYS:
            if key in self._customer_references:
                return True
        return False

    def to_dict(self):
        return self._customer_references

    def get_customer_reference(self, reference_key):
        if reference_key in self._customer_references:
            return self._customer_references[reference_key]
        return None

    @property
    def cost_center(self):
        return self.get_customer_reference('costCenter')

    @property
    def business_unit(self):
        return self.get_customer_reference('businessUnit')

    @property
    def project_code(self):
        return self.get_customer_reference('projectCode')

    @property
    def job_number(self):
        return self.get_customer_reference('jobNumber')

    @property
    def employee_id(self):
        return self.get_customer_reference('employeeId')

    @property
    def traveller_type(self):
        return self.get_customer_reference('travellerType')

    @property
    def traveller_last_name(self):
        return self.get_customer_reference('travellerLastName')

    @property
    def traveller_first_name(self):
        return self.get_customer_reference('travellerFirstName')

    @property
    def approver_last_name(self):
        return self.get_customer_reference('approverLastName')

    @property
    def approver_first_name(self):
        return self.get_customer_reference('approverFirstName')
