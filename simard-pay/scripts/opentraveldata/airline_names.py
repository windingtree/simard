import csv
import requests
from datetime import datetime

# Define hardcoded airlines
airlines_iata = {
    'S0': {'name': 'Aerolíneas Sosa'}
}

airlines_num = {}

airlines = []

invalid_records = [
    'air-bb-airways-v1',
    'air-aviastar-tu-v1',
    'air-dhl-international-aviation-me-v1',
    'air-executive-express-aviation-v1',
    'air-hageland-aviation-services-v1',
    'air-ikar-v1',
    'air-air-norway-v1',
    'air-lufthansa-cargo-v1',
    'air-med-view-airline-v1',
    'air-air-via-v1',
    'air-royal-wings-v1',
    'air-silk-way-airlines-v1',
    'air-sky-gabon-v1',
    'air-transwest-air-v2',
    'air-almasria-universal-airlines-v1',
    'air-speed-alliance-westbahn-v1',
    'air-wright-air-services-v1'
]

with open('optd_airlines.csv', newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter='^', lineterminator='\r\n')

    for row in reader:

        # Skip invalid records
        if row['pk'] in invalid_records:
            continue

        # Skip expired airline code
        if row['validity_to'] != '':
            continue

        # Skip unactivated airline code
        if row['validity_from'] == '':
            continue

        # Skip unactivated airline code
        if row['validity_from'] == '':
            continue

        iata_code = row['2char_code']
        if iata_code == '':
            continue

        if iata_code in airlines_iata:
            print("Duplicate! [%s]" % iata_code, row['pk'], airlines_iata[iata_code]['pk'])
            break

        iata_num = row['num_code']
        if iata_num in ['0', '']:
            continue

        if iata_num in airlines_num:
            print("Duplicate! [%s]" % iata_num, row['pk'], airlines_num[iata_num]['pk'])
            break

        airlines_iata[iata_code] = row
        airlines_num[iata_num] = row

        airlines.append((
            iata_code,
            iata_num,
            row['name']
        ))

airlines.sort(key=lambda x: x[0])
print(airlines)
