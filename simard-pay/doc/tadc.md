# TADC File

The TADC file contains travel data associated with the payment and is sent daily to American Express using an SFTP connection.

## Network Connection

American Express SFTP Connectivity Details are stored as environment variables:

* Host: `AMEX_TADC_HOST`
* User: `AMEX_TADC_USER`
* Password: `AMEX_TADC_PASSWORD`

Note that for PCI-DSS compliance reasons, Simard Pay integrates with the [PCI-Proxy HTTPS-to-SFTP service](https://docs.pci-proxy.com/use-stored-cards/forward/sftp)

## TADC File Format

### XML Structure

The TADC file is formatted in XML and encapsulated in a `<Message>` tag:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Message>
  ...
</Message>
```

The content of the sub-fields is described in the following section.

### Field Presence

The presence of each tag is indicated as follow:

| Code | Meaning |
|------|---------|
| M | Mandatory field |
| C | Conditional: Mandatory under certain conditions |
| O | Optional field |
| F | Fixed value field |

### Field Format

The format of each field is indicated as follow

| Code | Meaning | Description |
|------|---------|-------------|
| AN   | Alphanumeric |  A string consisting of letters and/or numbers and/or special characters |
| N    | Numeric |  Number values only, can use decimal if required |
| A    | Alpha | Only letters |
| T    | Tag | This field is a tag with multiple sub-fields |

## Message

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| VersNbr | F | N | Fixed value '201000001' | 201000001 |
| SubmrId | F | AN | Fixed value 'XMLSIMA153' | XMLSIMA153 |
| MsgSeqNbr | M | N | A unique number on 9 digits that increases by 1 for each file, left padded with zeroes. | 000000001 |
| CreateDt | M | N | File creation date YYYYMMDD, using Tallinn, Estonia timezone | 20120117 |
| CreateTm | M | N | File creation time HHMMSS, using Tallinn, Estonia timezone | 093055 |
| TravelBatch | M | T | Contains the travel data, repeated for each currency | *(see below)* |
| MessageTrailer | M | T | Contains counting data for file integrity purpose | *(see below)* |

**Example:**

```xml
<Message>
  <VersNbr>201000001</VersNbr>
  <SubmrId>XMLSIMA153</SubmrId>
  <MsgSeqNbr>000000001</MsgSeqNbr>
  <CreateDt>20120117</CreateDt>
  <CreateTm>093055</CreateTm>
  <TravelBatch>
    ...
  </TravelBatch>
  <TravelBatch>
    ...
  </TravelBatch>
  <MessageTrailer>
    ...
  </MessageTrailer>
</Message>
```

### TravelBatch

The Travel Batch contains all travel components of all tokens in a given `currency`.
This tag must be repeated for each different currency.

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| BtchSeqNbr | M | N | A unique number on 8 digits that increases by 1 for each file, left padded with zeroes. | 00000001 |
| ProviderNm | F | AN | Fixed value 'SIMARD' | SIMARD |
| TrvlBtchCurrCd | M | A | ISO4217 Currency Code on 3 characters | USD |
| TravelTran | M | T | Contains the travel transactions details. **Repeated for each travel component** | *(See below)* |
| BatchTrailer | M | T | Contains the batch summary | *(See below)* |

**Example:**

```xml
<TravelBatch>
    <BtchSeqNbr>00000001</BtchSeqNbr>
    <ProviderNm>SIMARD</ProviderNm>
    <TrvlBtchCurrCd>USD</TrvlBtchCurrCd>
    <TravelTran>
      ...
    </TravelTran>
    <BatchTrailer>
      ...
    </BatchTrailer>
</TravelBatch>
```

#### TravelTran

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| TransSeqNbr | M | N | Starting at 1 for the first transaction, each subsequent transaction (even for next file) should then increment by 1. Format on 9 digits with zero padding on the left | 000000001 |
| TransDt | M | N | Date of creation of the Travel Component, format YYYYMMDD (Tallinn timezone) | 20120203 |
| TransTm | M | N | Time of creation of the Travel Component, format HHMMSS (Tallinn timezone) | 093045 |
| MediaCd | F | N | Booking Media code. Fixed value `04` | 04 |
| CommodityCd | M | N | Indicates the type of commodity of the Travel Component. **See below table** | 001 |
| Account | M | T | Indicates the account details | *(See below)* |
| Account/AcctNbr | M | AN | Contains the tokenized account number from PCI-Proxy: `aliasAccountNumber` | AAABcHxr-sDssdexyrAAAfyXWIgaAF40 |
| Account/CrdExpDt | M | N | Card Expiry Date in MMYY format | 0423 |
| Amount | M | T | Contains the details of the amount | *(See below)* |
| Amount/TransAmt | M | N | Contains the Travel Component total amount in lower currency unit (eg.g: GBP 12.50 is 1250) | 1250 |
| Amount/DbCrInd | F | A | Fixed value 'D' | D |
| AddAmountGrp | M | T | Contains at least 1 (VAT) and max 30 `AddAmount` tags | *(See AddAmount below)* |
| Trip | M | T | Contains the Trip details | *(See below)* |
| Supplier | M | T | Contains the Supplier details | *(See below)* |
| Provider | M | T | Contains the Provider details | *(See below)* |
| CustRefGrp | C | T | Contains at least 1 and max 7 `CustRef` | *(See CustRef below)* |
| Commodity | M | T | Contains the detail of a travel component | *(See below)* |

**Comodity Codes:**

| Code | Meaning |
|------|---------|
| 001 | Air Tickets |
| 004 | Hotel |

##### AddAmountGrp and AddAmount

Contains the details of additional financial items.

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| AmtTypeCd | M | N | Contains the type of amount **See below table** | 057 |
| AddAmt | M | N | Contains the item amount in lower currency unit (eg.g: GBP 12.50 is 1250) | 1250 |
| DbCrInd | F | A | Credit Debit indicator, fixed value 'D' | D |

```xml
<AddAmountGrp>
    <AddAmount>
        <AmtTypeCd>001</AmtTypeCd>
        <AddAmt>100</AddAmt>
        <DbCrInd>D</DbCrInd>
        <AddAmtRt>5.25</AddAmtRt>
    </AddAmount>
    <AddAmount>
        <AmtTypeCd>002</AmtTypeCd>
        <AddAmt>200</AddAmt>
        <DbCrInd>D</DbCrInd>
        <AddAmtRt>5.26</AddAmtRt>
    </AddAmount>
</AddAmountGrp>
```

**IATA Taxes mapping:**

For amounts where `taxes/iataCode` is set.

| IATA | Country | Code | Meaning |
|------|---------|------|---------|
|  YQ  | *(Any)* |  014 | Surcharge Tax |
|  YR  | *(Any)* |  014 | Surcharge Tax |
|  XF  |      US |  015 | Airport Tax |
|  *(Any other)*  | *(Any)* |  046 | Miscellaneous Tax |

**Generic Tax mapping:**

For amounts where `taxes/taxId` is set:

| ID | Code | Meaning |
|----|---------|------|
| goods_and_services | 001 | Goods and Services Tax (GST) |
| provincial_sales | 003 | Provincial Sales Tax (PST) |
| quebec_sales | 004 | Quebec Sales Tax (QST) |
| value_added | 057 | Value Added Tax (VAT) |
|  *(Any other)*  |  046 | Miscellaneous Tax |

##### Trip

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| DestNm | M | AN | Trip destination. For hotels: the city name; for flights: the destination airport name. Maximum 20 characters. | Paris |
| DprtDt | M | N | The departure date or check-in date YYYYMMDD | 20210430 |
| TvlrFirstNm | M | AN | The first name of the first traveller | Steve |
| TvlrLastNm | M | AN | The last name of the first traveller | Smith-Jones |

**Note**: The Airport name is determined by looking up the destination IATA Airport code in the Open Travel Data database.

**Example:**

```xml
<Trip>
    <DestNm>Chicago Airport IL</DestNm>
    <DprtDt>20100419</DprtDt>
    <TvlrFirstNm>Robin</TvlrFirstNm>
    <TvlrLastNm>Hood</TvlrLastNm>
</Trip>
```

##### Supplier

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| SuplrNm | M | AN | The Hotel Name or Airline Name | American Airlines |
| VATNbr | O | AN | The VAT number of the Hotel, if available | 123456 |

**Note**: The Airline name is determined by looking up the airline IATA code in the Open Travel Data database.

**Example:**

```xml
<Supplier>
    <SuplrNm>Nordic Choice Hotel Oslo</SuplrNm>
    <VATNbr>1231234567890</VATNbr>
</Supplier>
```

##### Provider

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| AmexAgcyNbr | F | AN | Fixed value: SI53 | SI53 |
| AmexOfcNbr | F | AN | Fixed value: 032581525 | 032581525 |
| ProviderTransRefDa | O | AN | Last 27 characters of the Token UUID | 8005-4947-8032-00000000000 |
| InvInd | F | A | Invoiced By Amex Indicator, fixed value 'N' | N |
| InvNbr | F | AN | Simard invoice Number, fixed value 'INVOICE00' (**TO BE AGREED WITH CLIENT**)| INVOICE00 |
| InvDt | F | N | Simard invoice Date, fixed value '20211231' (**TO BE AGREED WITH CLIENT**)| 20211231 |
| IATANbr | F | N | Simard's IATA Number: 63320235 | 63320235 |

```xml
<Provider>
    <AmexAgcyNbr>SI53</AmexAgcyNbr>
    <AmexOfcNbr>032581525</AmexOfcNbr>
    <ProviderTransRefDa>8005-4947-8032-00000000000</ProviderTransRefDa>
    <InvInd>N</InvInd>
    <InvNbr>INVOICE00</InvNbr>
    <InvDt>20211231</InvDt>
    <IATANbr>63320235</IATANbr>
</Provider>
```

#### CustRefGrp

This tag contains one or multiple `CustRef` tags, and are taken from the `customerReferences` property which were provided when creating the Amex BTA Token. Fields are reported only of present. Fields are truncated if exceeding the max size. If none are present the group is omited.

The mapping for `CustRef` is as follow:

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| CustRefNbr | C | N | On two digits, left padded with zero. See mapping table below | 01 |
| CustRefTypeCd | C | AN | On four digits, left padded with zero. See mapping table below | 0001 |
| CustRefTx | C | AN | The value of the field | ABCDE-4 |

```xml
<CustRefGrp>
    <CustRef>
      <CustRefNbr>01</CustRefNbr>
      <CustRefTypeCd>0001</CustRefTypeCd>
      <CustRefTx>ABCDEFGHI</CustRefTx>
    </CustRef>
    <CustRef>
      <CustRefNbr>02</CustRefNbr>
      <CustRefTypeCd>0003</CustRefTypeCd>
      <CustRefTx>SMITH John</CustRefTx>
    </CustRef>
    <CustRef>
      <CustRefNbr>06</CustRefNbr>
      <CustRefTypeCd>0006</CustRefTypeCd>
      <CustRefTx>BUSIN</CustRefTx>
    </CustRef>
</CustRefGrp>
```

Reference Mapping Table:

| CustRefNbr | CustRefTypeCd | Max length | Property |
|------------|---------------|------------|----------|
| 01 | 0001 |  9 | `costCenter` |
| 02 | 0003 | 24 | Concatenation of `approverLastName`, space, `approverFirstName` |
| 03 | 0002 | 10 | `employeeId` |
| 04 | 0004 | 10 | `jobNumber` |
| 05 | 0005 | 15 | `projectCode` |
| 06 | 0006 |  5 | `businessUnit` |

#### Commodity

The `Commodity` tag contains either a `Air` or an `Hotel` tag.

##### Air

The `Air` commodity is used in conjunction with the Commodity Code `001 - Air` which related to travel component of type `air`.

The mapping is as follow:

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| TktNbr | M | N | Ticket number on 14 digits. From Travel Component `documentNumber` | 15147568054247 |
| AirTransTypeCd | AN | AN | Type of Air Document. Mapped from Travel Component `documentType`: TKT->TKT, EMD->MSC | TKT |
| TktIssDt | M | AN | The document issuance date in format YYYYMMDD. From Travel Component `documentIssuanceDate` | 20120320 |
| ETktInd | F | A | E-ticket indicator. Fixed value Y - Yes | Y |
| PNRLocCd | M | AN | PNR Record Locator. From Travel Component `recordLocator` | ABCDEF |
| AirSectorGrp | M | T | Contains a list of `AirSector` tags, one per Travel Component's `segments` | *(See below)* |

```xml
<Air>
  <TktNbr>15147568054247</TktNbr>
  <AirTransTypeCd>TKT</AirTransTypeCd>
  <TktIssDt>20210304</TktIssDt>
  <ETktInd>Y</ETktInd>
  <PNRLocCd>ABCDEF</PNRLocCd>
  <AirSectorGrp>
    <AirSector>...</AirSector>
    <AirSector>...</AirSector>
  </AirSectorGrp>
</Air>
```

###### AirSector

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| SctrNbr | M | N | Sector number incremented for each sector. Two digits, left padded with zeros. | 01 |
| CarrierCd | M | AN | Marketing airline IATA code on two alphanum. From Segment's `iataCode` | AA |
| FlightNbr | M | N | Flight number on 4 digits, left padded with zeros. From Segment's `flightNumber` | 0123 |
| SctrTypeCd | F | A | Fixed value `A` for Air | A |
| SctrClassCd | M | AN | Class of service code, from segment's `serviceClass` | C |
| DomesticInd | M | AN | Indicates if the `origin` and `destination` are in the same country (`Y` or `N`) | Y |
| DprtAirCd | M | AN | Three letter code of the origin airport. From Segment's `origin` | LHR |
| ArrAirCd | M | AN | Three letter code of the destination airport. From Segment's `destination` | LHR |
| DprtDt | M | AN | Departure time in YYYYMMDD format, using the `origin`'s airport timezone. From Segment's `departureTime` | 20120430 |
| ArrDt | M | AN | Arrival time in YYYYMMDD format, using the `destination`'s airport timezone. From Segment's `arrivalTime` | 20120430 |

##### Hotel

TODO

#### BatchTrailer

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| BtchDbCnt | M | N | Counts the number of debit in the batch. 9 digits | 000000001 |
| BtchDbTot | M | N | Total value of debits in the batch, Using lower currency units (GBP 17.23 as 1723) | 1723 |
| BtchCrCnt | F | N | Counts the number of credit in the batch. Fixed value '0' | 0 |
| BtchCrTot | F | N | Total value of credits in the batch. Fixed value '0' | 0 |
| BtchCnt | M | N | Counts the number of transactions in the batch. Same as Debits. | 1 |
| BtchTot | M | N | Total value of transactions in the batch. Same as debits | 1723 |
| BtchDbCrInd | F | A | Debit Indicator, fixed value 'D' | D |

**Example:**

```xml
<BatchTrailer>
    <BtchDbCnt>000000004</BtchDbCnt>
    <BtchDbTot>0000000004000</BtchDbTot>
    <BtchCrCnt>000000000</BtchCrCnt>
    <BtchCrTot>0000000000000</BtchCrTot>
    <BtchCnt>000000004</BtchCnt>
    <BtchTot>0000000004000</BtchTot>
    <BtchDbCrInd>D</BtchDbCrInd>
</BatchTrailer>
```

### MessageTrailer

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| BatchTrailer | M | T | Contains the trailer | *(See below)* |
| SettleBtchCnt | F | N | Fixed value '0' | 0 |
| TrvlBtchCnt | M | N | Counts the number of TravelBatch in the file | 1 |
| CurrencyTotGrp | M | T | Contains the currencies totals |  *(See below)* |
| CurrencyTotGrp/CurrencyTot | M | T | Contains the total for one currency. **Tag repeated for each currency** |  *(See below)* |

**Example:**

```xml
<MessageTrailer>
    <SettleBtchCnt>000000001</SettleBtchCnt>
    <TrvlBtchCnt>000000001</TrvlBtchCnt>
    <CurrencyTotGrp>
        <CurrencyTot>
           ...
        </CurrencyTot>
        <CurrencyTot>
           ...
        </CurrencyTot>
    </CurrencyTotGrp>
</MessageTrailer>
```

#### CurrencyTot

| Tag | C | Format | Description | Example |
|-----|---|--------|-------------|---------|
| CurrencyCd | M | A | ISO4217 Currency code | GBP |
| TravelTranDbCnt | M | N | Total number of debit transactions | 1 |
| TravelTranDbTot | M | N | Total amount for all debit transactions. Using lower currency units (GBP 17.23 as 1723) | 1723 |
| TravelTranCrCnt | F | N | Total number of credit transactions, fixed value 0 | 0 |
| TravelTranCrTot | F | N | Total amount for all credit transactions. fixed value 0 | 0 |
| TravelTranCnt | M | N | Total number of transactions (same as debit transactions) | 1 |
| TravelTranTot | M | N | Total amount for all transactions. Same as Debit. Using lower currency units (GBP 17.23 as 1723) | 1723 |
| TravelDbCrInd | F | A | Debit Indicator, fixed value 'D' | D |
| SettleTranDbCnt | F | N | Fixed value 0 | 0 |
| SettleTranDbTot | F | N | Fixed value 0 | 0 |
| SettleTranCrCnt | F | N | Fixed value 0 | 0 |
| SettleTranCrTot | F | N | Fixed value 0 | 0 |
| SettleTranCnt | F | N | Fixed value 0 | 0 |
| SettleTranTot | F | N | Fixed value 0 | 0 |
| SettleDbCrInd | F | A | Debit Indicator, fixed value 'D' | D |

**Example:**

```xml
<CurrencyTot>
    <CurrencyCd>GBP</CurrencyCd>
    <TravelTranDbCnt>000000004</TravelTranDbCnt>
    <TravelTranDbTot>0000000004000</TravelTranDbTot>
    <TravelTranCrCnt>000000000</TravelTranCrCnt>
    <TravelTranCrTot>0000000000000</TravelTranCrTot>
    <TravelTranCnt>000000004</TravelTranCnt>
    <TravelTranTot>0000000004000</TravelTranTot>
    <TravelDbCrInd>D</TravelDbCrInd>
    <SettleTranDbCnt>0</SettleTranDbCnt>
    <SettleTranDbTot>0</SettleTranDbTot>
    <SettleTranCrCnt>0</SettleTranCrCnt>
    <SettleTranCrTot>0</SettleTranCrTot>
    <SettleTranCnt>0</SettleTranCnt>
    <SettleTranTot>0</SettleTranTot>
    <SettleDbCrInd>D</SettleDbCrInd>
</CurrencyTot>
```
