from .exception import SimardException

AIRLINES_DATA = [('2P', '211', 'PAL Express'), ('3H', '466', 'Air Inuit'), ('3O', '452', 'Air Arabia Maroc'), ('4A', '212', 'Aero Transporte'), ('4B', '184', 'Boutique Air'), ('4C', '35', 'LATAM Colombia'), ('4N', '287', 'Air North'), ('4O', '837', 'Interjet'), ('5B', '590', 'Bassaka Air'), ('5D', '642', 'Aeroméxico Connect'), ('5J', '203', 'Cebu Pacific'), ('5T', '518', 'Canadian North'), ('5Z', '225', 'CemAir'), ('6A', '616', 'Armenia Airways'), ('7U', '428', 'Alpha Air Transport'), ('8C', '813', 'Air Transport International'), ('8H', '366', 'BH Air'), ('8V', '485', 'Astral Aviation'), ('9H', '856', 'Chang An Airlines'), ('9J', '234', 'Dana Air'), ('9K', '306', 'Cape Air'), ('9T', '556', 'MyCargo Airlines'), ('9V', '742', 'Avior Airlines'), ('A2', '273', 'Astra Airlines'), ('A3', '390', 'Aegean Airlines'), ('A4', '222', 'Azimuth'), ('AA', '1', 'American Airlines'), ('AC', '14', 'Air Canada'), ('AD', '577', 'Azul Brazilian Airlines'), ('AF', '57', 'Air France'), ('AG', '209', 'Aruba Airlines'), ('AH', '124', 'Air Algerie'), ('AI', '98', 'Air India'), ('AK', '807', 'AirAsia'), ('AP', '374', 'AlbaStar'), ('AQ', '902', '9 Air'), ('AR', '44', 'Aerolíneas Argentinas'), ('AS', '27', 'Alaska Airlines'), ('AU', '143', 'Austral Líneas Aéreas'), ('AV', '134', 'Avianca'), ('AW', '394', 'Africa World Airlines'), ('AZ', '55', 'Alitalia'), ('B2', '628', 'Belavia'), ('BA', '125', 'British Airways'), ('BD', '688', 'Cambodia Bayon Airlines'), ('BG', '997', 'Biman Bangladesh Airline'), ('BM', '480', 'bmi regional'), ('BO', '290', 'Bluebird Nordic'), ('BT', '657', 'airBaltic'), ('BU', '883', "Compagnie Africaine d'Aviation"), ('BW', '106', 'Caribbean Airlines'), ('BX', '982', 'Air Busan'), ('C5', '841', 'CommutAir'), ('C8', '498', 'Cronos Airlines'), ('CA', '999', 'Air China'), ('CC', '907', 'CM Airlines'), ('CG', '626', 'PNG Air'), ('CI', '297', 'China Airlines'), ('CM', '230', 'Copa Airlines'), ('CP', '3', 'Compass Airlines'), ('CV', '172', 'Cargolux'), ('CX', '160', 'Cathay Pacific'), ('CY', '078', 'Charlie Airlines'), ('CZ', '784', 'China Southern Airlines'), ('D0', '936', 'DHL Air UK'), ('D4', '443', 'DART Ltd'), ('DC', '215', 'Braathens Regional'), ('DE', '881', 'Condor'), ('DL', '6', 'Delta Air Lines'), ('DX', '243', 'Danish Air Transport'), ('E5', '844', 'Air Arabia Egypt'), ('EI', '53', 'Aer Lingus'), ('FL', '332', 'Airtran Airways'), ('G4', '268', 'Allegiant Air'), ('G5', '987', 'China Express Airlines'), ('G9', '514', 'Air Arabia'), ('GB', '832', 'ABX Air'), ('GL', '631', 'Air Greenland'), ('GP', '275', 'APG Airlines'), ('GT', '730', 'Air Guilin'), ('GY', '661', 'Colorful Guizhou Airlines'), ('HB', '943', 'Asia Atlantic Airlines'), ('HC', '490', 'Air Senegal'), ('I3', '917', 'ATA Airlines'), ('IG', '191', 'Air Italy'), ('IO', '154', 'IrAero'), ('J8', '801', 'Berjaya Air'), ('JD', '898', 'Beijing Capital Airlines'), ('JU', '115', 'Air Serbia'), ('JV', '632', 'Bearskin Airlines'), ('JX', '704', 'DAC East Africa'), ('K6', '188', 'Cambodia Angkor Air'), ('K7', '314', 'Air KBZ'), ('KC', '465', 'Air Astana'), ('KF', '142', 'Air Belgium'), ('KH', '687', 'Aloha Air Cargo'), ('KJ', '994', 'Air Incheon'), ('KL', '74', 'KLM Royal Dutch Airlines'), ('KK', '610', 'AtlasGlobal'), ('KP', '32', 'ASKY Airlines'), ('L5', '402', 'Atlantique Air Assistance'), ('L8', '348', 'Afric Aviation'), ('LF', '522', 'Corporate Flight Management'), ('M6', '810', 'Amerijet International'), ('MN', '161', 'Comair'), ('MQ', '93', 'Envoy Air'), ('MU', '781', 'China Eastern Airlines'), ('NF', '218', 'Air Vanuatu'), ('NH', '205', 'All Nippon Airways'), ('NT', '474', 'Binter Canarias'), ('NX', '675', 'Air Macau'), ('NY', '882', 'Air Iceland'), ('NZ', '86', 'Air New Zealand'), ('OB', '930', 'Boliviana de Aviación (BoA)'), ('OK', '64', 'Czech Airlines'), ('OR', '178', 'TUI Airlines Netherlands'), ('OS', '257', 'Austrian Airlines'), ('OU', '831', 'Croatia Airlines'), ('OY', '650', 'Andes Líneas Aéreas'), ('OZ', '988', 'Asiana Airlines'), ('P4', '710', 'Air Peace'), ('P5', '845', 'Copa Airlines Colombia'), ('PA', '84', 'Airblue'), ('PG', '829', 'Bangkok Airways'), ('PM', '496', 'Canaryfly'), ('PQ', '62', 'AirAsia Philippines'), ('QC', '40', 'Camair-Co'), ('QZ', '975', 'Indonesia AirAsia'), ('RC', '767', 'Atlantic Airways'), ('RE', '743', 'Stobart Air'), ('RM', '437', 'Aircompany Armenia'), ('RS', '820', 'Air Seoul'), ('SB', '63', 'Aircalin'), ('SI', '821', 'Blue Islands'), ('SM', '381', 'Air Cairo'), ('SN', '82', 'Brussels Airlines'), ('SS', '923', 'Corsair'), ('SU', '555', 'Aeroflot'), ('TL', '935', 'Airnorth'), ('TN', '244', 'Air Tahiti Nui'), ('TS', '649', 'Air Transat'), ('TX', '427', 'Air Caraibes'), ('UA', '016', 'United Airlines'), ('UM', '168', 'Air Zimbabwe'), ('UP', '111', 'Bahamasair'), ('UU', '760', 'Air Austral'), ('UX', '996', 'Air Europa'), ('UZ', '928', 'Buraq Air'), ('V3', '21', 'Carpatair'), ('VT', '135', 'Air Tahiti'), ('VW', '942', 'Aeromar'), ('W3', '725', 'Arik Air'), ('WJ', '927', 'Air Labrador'), ('XK', '146', 'Air Corsica'), ('Y7', '476', 'NordStar'), ('YJ', '601', 'Asian Wings Airways'), ('YW', '694', 'Air Nostrum'), ('YZ', '570', 'Alas Uruguay'), ('Z7', '455', 'Amaszonas Uruguay'), ('Z8', '464', 'Línea Aérea Amaszonas'), ('ZI', '439', 'Aigle Azur'), ('ZP', '445', 'Paranair'), ('ZW', '303', 'Air Wisconsin'), ('--', '000', 'unknown')]

class AirlineException(SimardException):
    pass

class Airline(object):
    def __init__(self, iata_code: str, iata_num: str, name: str):
        self.iata_code = iata_code
        self.iata_num = iata_num
        self.name = name

    @classmethod
    def from_iata_code(cls, iata_code: str):
        for airline in AIRLINES_DATA:
            if iata_code == airline[0]:
                return cls(airline[0], airline[1], airline[2])
        raise AirlineException('IATA Code not found: %s' % iata_code, 400)

    @classmethod
    def from_iata_num(cls, iata_num: str):
        for airline in AIRLINES_DATA:
            if iata_num == airline[1].zfill(3):
                return cls(airline[0], airline[1], airline[2])
        raise AirlineException('IATA Num not found: %s' % iata_num, 400)

    @staticmethod
    def is_valid_document(document_number: str):
        if type(document_number) != str or len(document_number) != 14:
            return False
        try:
            Airline.from_iata_num(document_number[:3])
        except AirlineException:
            return False

        return True
