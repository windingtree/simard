import unittest
from simard.rate_manager import RateManager, RateManagerException
from unittest import mock
from decimal import Decimal

TRANSFERWISE_API_ENDPOINT = 'https://api.sandbox.transferwise.tech/v1'
TRANSFERWISE_API_TOKEN = '52a1a8f0-f962-478e-83a4-000000000000'
TRANSFERWISE_PROFILE_ID = '00000000'

@mock.patch("simard.rate_manager.TRANSFERWISE_API_ENDPOINT", TRANSFERWISE_API_ENDPOINT)
@mock.patch("simard.rate_manager.TRANSFERWISE_API_TOKEN", TRANSFERWISE_API_TOKEN)
@mock.patch("simard.rate_manager.TRANSFERWISE_PROFILE_ID", TRANSFERWISE_PROFILE_ID)
class TestRateManager(unittest.TestCase):
    def setUp(self):
        self.orgid = '0x0000000000000000000000000000000000000000000000000000000000005121'
        self.agent = 'did:orgid:%s#myAgentKey' % self.orgid
        self.currency = 'EUR'
        self.iban = 'BE71096123456769'

        # A Patcher for the TW GET
        tw_get_patcher = mock.patch('requests.get')
        self.mock_get = tw_get_patcher.start()
        self.mock_get.return_value.text = "[{\"rate\": 1.21129}]"
        self.mock_get.return_value.status_code = 200
        self.addCleanup(tw_get_patcher.stop)

    def test_get_rate(self):
        """
        Test getting a rate
        """
        self.assertEqual(RateManager.get_rate(self.orgid, self.agent, 'EUR', 'USD'), Decimal('1.21129'))
