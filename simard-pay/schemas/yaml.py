"""
Wrapper object to get the ABIs from memory
"""
import yaml
from schemas.yaml_orgid_034 import yaml as orgid_yaml_034
from schemas.yaml_orgid_043 import yaml as orgid_yaml_043



class YAML(object):
    def __init__(self, version='0.3.4'):
        if version == '0.3.4':
            self.orgid = yaml.load(orgid_yaml_034, Loader=yaml.FullLoader)
        else:
            self.orgid = yaml.load(orgid_yaml_043, Loader=yaml.FullLoader)
