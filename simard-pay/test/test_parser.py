import unittest
from decimal import Decimal
from simard.parser import Parser, ParserException
import dateutil.parser


class TestParser(unittest.TestCase):
    """
    Test Case for the parsers
    """
    def setUp(self):
        self.short_orgid = '0x0000000000000000000000000000000000099340'
        self.long_orgid = self.short_orgid + '7355bb2e4ebf999c7ecc5808'

    def test_parse_currency(self):
        """
        Test parsing currencies
        """
        self.assertEqual('EUR', Parser.parse_currency('EUR'))
        self.assertEqual('USD', Parser.parse_currency('USD'))
        self.assertEqual('AFN', Parser.parse_currency('AFN'))
        self.assertEqual('INR', Parser.parse_currency('INR'))
        self.assertEqual('JOD', Parser.parse_currency('JOD'))

        with self.assertRaises(ParserException):
            Parser.parse_currency(None)
        with self.assertRaises(ParserException):
            Parser.parse_currency(1)
        with self.assertRaises(ParserException):
            Parser.parse_currency('USD2')

    def test_parse_country_code(self):
        """
        Test parsing country codes
        """
        self.assertEqual('DE', Parser.parse_country_code('DE'))
        self.assertEqual('US', Parser.parse_country_code('US'))
        self.assertEqual('AF', Parser.parse_country_code('AF'))
        self.assertEqual('IN', Parser.parse_country_code('IN'))
        self.assertEqual('JO', Parser.parse_country_code('JO'))

        with self.assertRaises(ParserException):
            Parser.parse_country_code(None)
        with self.assertRaises(ParserException):
            Parser.parse_country_code(1)
        with self.assertRaises(ParserException):
            Parser.parse_country_code('DE2')
        with self.assertRaises(ParserException):
            Parser.parse_country_code('USA')

    def test_parse_amount(self):
        """
        Test parsing amounts
        """
        self.assertEqual(Decimal('1000'), Parser.parse_amount('1000'))
        self.assertEqual(Decimal('100.9999'), Parser.parse_amount('100.9999'))
        self.assertEqual(Decimal('1.00'), Parser.parse_amount(1))

        with self.assertRaises(ParserException):
            Parser.parse_amount(None)
        with self.assertRaises(ParserException):
            Parser.parse_amount('USD2')
        with self.assertRaises(ParserException):
            Parser.parse_amount('infinity')
        with self.assertRaises(ParserException):
            Parser.parse_amount('0.00')
        with self.assertRaises(ParserException):
            Parser.parse_amount('-2')

    def test_parse_orgid(self):
        """
        Test parsing ORG.IDs
        """
        self.assertEqual(
            self.long_orgid,
            Parser.parse_orgid(self.long_orgid)
        )
        self.assertEqual(
            self.long_orgid,
            Parser.parse_orgid('did:orgid:%s' % self.long_orgid)
        )
        self.assertEqual(
            self.long_orgid,
            Parser.parse_orgid('did:orgid:5:%s' % self.long_orgid)
        )

        with self.assertRaises(ParserException):
            Parser.parse_orgid(None)
        with self.assertRaises(ParserException):
            Parser.parse_orgid(1)
        with self.assertRaises(ParserException):
            Parser.parse_orgid("0x")
        with self.assertRaises(ParserException):
            Parser.parse_orgid("<simard>")
        with self.assertRaises(ParserException):
            Parser.parse_orgid(self.short_orgid)
        with self.assertRaises(ParserException):
            Parser.parse_orgid('did:orgid:%s' % self.short_orgid)

    def test_parse_agent(self):
        """
        Test parsing ORG.ID Agent's identifier
        """
        self.assertEqual(
            self.short_orgid,
            Parser.parse_agent(self.short_orgid)
        )
        self.assertEqual(
            'did:orgid:%s#1234' % self.short_orgid,
            Parser.parse_agent('did:orgid:%s#1234' % self.short_orgid)
        )
        self.assertEqual(
            'did:orgid:%s#abcde' % self.long_orgid,
            Parser.parse_agent('did:orgid:%s#abcde' % self.long_orgid)
        )
        self.assertEqual(
            'did:orgid:5:%s#abcde' % self.long_orgid,
            Parser.parse_agent('did:orgid:5:%s#abcde' % self.long_orgid)
        )

        with self.assertRaises(ParserException):
            Parser.parse_agent(None)
        with self.assertRaises(ParserException):
            Parser.parse_agent(1)
        with self.assertRaises(ParserException):
            Parser.parse_agent(self.long_orgid)
        with self.assertRaises(ParserException):
            Parser.parse_agent('did:orgid:%s' % self.long_orgid)
        with self.assertRaises(ParserException):
            Parser.parse_agent('did:orgid:%s#' % self.long_orgid)
        with self.assertRaises(ParserException):
            Parser.parse_agent('did:orgid:%s' % self.short_orgid)

    def test_parse_expiration(self):
        """
        Test parsing Expiration dates
        """
        d1 = '3020-12-05T12:16:14+05:00'
        self.assertEqual(
            dateutil.parser.isoparse(d1),
            Parser.parse_expiration(d1)
        )

        d2 = '2218-05-25T12:16:14+00:00'
        self.assertEqual(
            dateutil.parser.isoparse(d2),
            Parser.parse_expiration(d2)
        )

    def test_parse_iban(self):
        """
        Test parsing IBANs
        """
        # Valid IBANs
        i1 = "BE71096123456769"
        self.assertEqual(i1, Parser.parse_iban(i1))
        i2 = "RO09BCYP0000001234567890"
        self.assertEqual(i2, Parser.parse_iban(i2))
        i3 = "GB98MIDL07009312345678"
        self.assertEqual(i3, Parser.parse_iban(i3))

        # Invalid IBANs
        with self.assertRaises(ParserException):
            Parser.parse_iban('999999945748')
        with self.assertRaises(ParserException):
            Parser.parse_iban('ABC999999945748')
        with self.assertRaises(ParserException):
            Parser.parse_iban('99AB999999945748')
        with self.assertRaises(ParserException):
            Parser.parse_iban('BE7109612345676999999999999999999999999')

    def test_parse_transaction_hash(self):
        """
        Test parsing transaction hashes
        """
        # Valid transaction hashes
        h1 = "0x555000000000000000000000000000000000000000000000000000000000a121"
        self.assertEqual(h1, Parser.parse_transaction_hash(h1))
        h2 = "0x777000000000000000000000000000000000000000000000000000000000A121"
        self.assertEqual(h1, Parser.parse_transaction_hash(h2))
        h3 = "555000000000000000000000000000000000000000000000000000000000a121"
        self.assertEqual(h1, Parser.parse_transaction_hash(h3))

        # Invalid IBANs
        with self.assertRaises(ParserException):
            Parser.parse_transaction_hash('999999945748')
        with self.assertRaises(ParserException):
            Parser.parse_transaction_hash('ABC999999945748')
        with self.assertRaises(ParserException):
            Parser.parse_transaction_hash('99AB999999945748')

    def test_parse_instrument(self):
        """
        Test parsing instrument
        """
        self.assertEqual('blockchain', Parser.parse_instrument('blockchain'))

        with self.assertRaises(ParserException):
            Parser.parse_instrument('abc')

    def test_parse_chain(self):
        """
        Test parsing chains
        """
        self.assertEqual('ethereum', Parser.parse_chain('ethereum'))

        with self.assertRaises(ParserException):
            Parser.parse_chain('bitcoin')

    def test_parse_integer(self):
        """
        Test parsing integeer
        """
        self.assertEqual(12, Parser.parse_integer(12))
        self.assertEqual(123, Parser.parse_integer('123'))

        with self.assertRaises(ParserException):
            Parser.parse_integer('abc')

        with self.assertRaises(ParserException):
            Parser.parse_integer('-1')

        with self.assertRaises(ParserException):
            Parser.parse_integer(0)

    def test_parse_month(self):
        """
        Test parsing month
        """
        self.assertEqual('12', Parser.parse_month('12'))
        self.assertEqual('01', Parser.parse_month('01'))

        with self.assertRaises(ParserException):
            Parser.parse_month('13')

        with self.assertRaises(ParserException):
            Parser.parse_month('-1')

        with self.assertRaises(ParserException):
            Parser.parse_month(0)

    def test_parse_year(self):
        """
        Test parsing year
        """
        self.assertEqual('2021', Parser.parse_year('2021'))
        self.assertEqual('2050', Parser.parse_year('2050'))

        with self.assertRaises(ParserException):
            Parser.parse_year('134')

        with self.assertRaises(ParserException):
            Parser.parse_year('-1')

        with self.assertRaises(ParserException):
            Parser.parse_year(2021)

        with self.assertRaises(ParserException):
            Parser.parse_year('0123')

    def test_parse_cardholder_name(self):
        for name in [
            'Joe Bobby',
            'MR test test',
            'Kind Uhn-Han',
            'Mc\'henzy',
        ]:
            self.assertEqual(name, Parser.parse_cardholder_name(name))

        for name in [
            1234,
            '1234',
            '1-baboo',
            'this is way too loooonggrteretettet tettetet tetetetfdf fdfdfdf fdfdfdf'
        ]:
            with self.assertRaises(ParserException):
                Parser.parse_cardholder_name(name)


    def test_parse_did_into_elements(self):
        self.assertEqual(('5', '0x0000000000000000000000000000000000000000000000000000000019005121', 'SimardKMSMultisig'), Parser.parse_did_into_elements('did:orgid:5:0x0000000000000000000000000000000000000000000000000000000019005121#SimardKMSMultisig'))
        self.assertEqual((None, '0x0000000000000000000000000000000000000000000000000000000019005121', None), Parser.parse_did_into_elements('did:orgid:0x0000000000000000000000000000000000000000000000000000000019005121'))
        self.assertEqual((None, '0x0000000000000000000000000000000000000000000000000000000019005121', 'SimardKMSMultisig'), Parser.parse_did_into_elements('did:orgid:0x0000000000000000000000000000000000000000000000000000000019005121#SimardKMSMultisig'))
