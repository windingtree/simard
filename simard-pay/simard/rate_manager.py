"""
Define a manager class to manage rates objects
"""
from model.exception import SimardException
from simard.parser import Parser
import requests
from simard.settings import TRANSFERWISE_API_ENDPOINT
from simard.settings import TRANSFERWISE_API_TOKEN
from simard.settings import TRANSFERWISE_PROFILE_ID
import simplejson as json

class RateManagerException(SimardException):
    pass


class RateManager(object):

    @staticmethod
    def get_rate(orgid, agent, source_currency, target_currency):
        """
        Get a quote for its id
        """
        # Parse all fields for security
        orgid = Parser.parse_orgid(orgid)
        agent = Parser.parse_agent(agent)
        source_currency = Parser.parse_currency(source_currency)
        target_currency = Parser.parse_currency(target_currency)

        r = requests.get(
            TRANSFERWISE_API_ENDPOINT + '/rates',
            params={
                'source': source_currency,
                'target': target_currency,
            },
            headers={
                'Authorization': ("Bearer %s" % TRANSFERWISE_API_TOKEN),
            }
        )

        # Verify the response code
        if(r.status_code != 200):
            raise RateManagerException(
                'Error when retreiving rate [%s]' % r.text,
                502
            )

        # Extract values from Transferwise rate
        # Use simplejson lib instead of requests to force use of decimals
        tranferwise_rate = json.loads(r.text, use_decimal=True)
        return tranferwise_rate[0]['rate']
