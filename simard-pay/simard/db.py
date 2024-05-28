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
    def guarantees(self):
        return self._database.guarantees

    @property
    def settlements(self):
        return self._database.settlements

    @property
    def accounts(self):
        return self._database.accounts

    @property
    def quotes(self):
        return self._database.quotes

    @property
    def tokens(self):
        return self._database.tokens

    @property
    def intents(self):
        return self._database.intents

    @property
    def profiles(self):
        return self._database.profiles

    def is_collection_created(self, name):
        return (name in self._database.list_collection_names())


db = DB()
