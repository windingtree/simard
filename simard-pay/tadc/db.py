"""
Simple wrapper around pymongo for the project needs
"""
from pymongo import MongoClient
from .settings import MONGODB_DATABASE_URI


class DB(object):
    def __init__(self):
        client = MongoClient(MONGODB_DATABASE_URI)
        self._database = client.get_default_database(default='simard')

    @property
    def tokens(self):
        return self._database.tokens

    @property
    def tadc_reports(self):
        return self._database.tadc_reports

db = DB()
