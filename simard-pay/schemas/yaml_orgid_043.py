yaml = """
$id: org.json
title: ORG.JSON
description: >-
  ORG.JSON represents an organization or one of its structural units
  (departments, stores, etc.). In W3C terminology it is called DID Document.
type: object
required:
  - '@context'
  - id
  - created
properties:
  schemaVersion:
    description: >-
      Semantic version of the org.json schema.
      If not defined it means the latest version
    type: string
    pattern: "^([0-9]+.)?([0-9]+.)?([0-9]+)$"
    example: "0.3.2"
  '@context':
    $ref: '#/definitions/ContextReference'
  id:
    $ref: '#/definitions/DIDReference'
  created:
    description: Date-time when the data was created.
    type: string
    format: date-time
  updated:
    description: Date-time when the data was last changed.
    type: string
    format: date-time
  publicKey:
    description: >-
      Public keys are used for digital signatures, encryption and other
      cryptographic operations, which in turn are the basis for purposes such as
      authentication or establishing secure communication with service
      endpoints.
    type: array
    items:
      $ref: '#/definitions/PublicKeyReference'
  service:
    description: >-
      One of the primary purposes of ORG.JSON is to enable discovery of
      service endpoints (aka API URIs).
    type: array
    items:
      $ref: '#/definitions/ServiceReference'
  payment:
    description: >-
      Public information about payment accounts of the organization.
    type: array
    items:
      $ref: '#/definitions/PaymentReference'
  trust:
    description: "Trust records: assertions and credentials"
    type: object
    properties:
      assertions:
        $ref: '#/definitions/TrustAssertionsReference'
      credentials:
        $ref: '#/definitions/TrustCredentialsReference'
  legalEntity:
    $ref: '#/definitions/LegalEntityReference'
  organizationalUnit:
    $ref: '#/definitions/OrganizationalUnitReference'
definitions:
  LegalEntityReference:
    description: Legal entity information
    type: object
    required:
      - legalName
      - registryCode
      - legalType
      - registeredAddress
    properties:
      legalName:
        description: Legal name, e.g. 'Acme, Inc.' or 'Ajax Ltd.'
        type: string
      alternativeName:
        description: >-
          A recognized name other than the legal name. Some jurisdictions
          recognize concepts such as a trading name or alternative forms of a
          legal entity's name. The Alternative Name property can be used to
          record such names but should not be used to record translations of the
          primary legal name. Where more than one legal name exists and where
          they have equal standing but are expressed in different languages,
          identify the language used in each of the multiple legal names. It is
          notable that some jurisdictions regard the use of any name other than
          the primary Legal Name as suspicious.
        type: string
      registryCode:
        description: >-
          Identifier given to the legal entity by the authority with which
          it is registered.
        type: string
      identifiers:
        description: >-
          A formally-issued identifier for the legal entity, other than the one
          that confers legal status upon it. Legal entities may have any number
          of identifiers (but only one legal identifier). For example, in many
          jurisdictions, a business will have one or more tax numbers associated
          with them which do not, by themselves, confer legal entity status. The
          Identifier property must not be used to link to the identifier issued
          by the authority that conferred legal entity status on a business.
        type: array
        items:
          allOf:
            - $ref: '#/definitions/IdentifierReference'
      legalType:
        description: 'Legal entity type: limited company, corporation, NGO, etc.'
        type: string
      registeredAddress:
        $ref: '#/definitions/AddressReference'
      locations:
        type: array
        items:
          allOf:
            - $ref: '#/definitions/LocationReference'
      contacts:
        type: array
        items:
          allOf:
            - $ref: '#/definitions/ContactReference'
      media:
        $ref: '#/definitions/MediaListReference'
  OrganizationalUnitReference:
    description: Organizational unit
    type: object
    required:
      - name
    properties:
      name:
        description: >-
          Unit name e.g. "Grand Budapest Hotel", "Accounting Department"
          or "Acme 13th Ave"
        type: string
      type:
        description: Unit type, e.g. ["hotel", "boutique"]
        type: array
        items:
          allOf:
            - type: string
      description:
        description: Short description of the unit
        type: string
      longDescription:
        description: Long description of the unit
        type: string
      address:
        $ref: '#/definitions/AddressReference'
      openingHours:
        $ref: '#/definitions/OpeningHoursReference'
      contacts:
        type: array
        items:
          allOf:
            - $ref: '#/definitions/ContactReference'
      media:
        $ref: '#/definitions/MediaListReference'
  ContextReference:
    description: >-
      When two software systems need to exchange data, they need to use
      terminology and a protocol that both systems understand. The @context
      property ensures that two systems operating on the same DID document are
      using mutually agreed terminology.
    oneOf:
      - $ref: '#/definitions/LinkedContextReference'
      - $ref: '#/definitions/LinkedMultipleContextReference'
      - $ref: '#/definitions/LinkedContextDocumentReference'
  LinkedContextReference:
    description: Linked context URI
    type: string
    example:
      "https://www.w3.org/ns/did/v1"
  LinkedMultipleContextReference:
    description: A list of context references
    type: array
    items:
      allOf:
        - $ref: '#/definitions/LinkedContextReference'
    example: >-
      [
        "https://www.w3.org/ns/did/v1",
        "https://windingtree.com/ns/orgid/v1"
      ]
  LinkedContextDocumentReference:
    description: 'Context document https://www.w3.org/TR/json-ld/#the-context'
    type: object
    example: >-
      {
        "@context": "https://json-ld.org/contexts/person.jsonld",
        "name": "Example Site",
        "homepage": "http://example.site.org/",
        "image": "http://example.site.org/images/person.png"
      }
  DIDReference:
    description: >-
      The DID subject is denoted by the id property. The DID subject is the
      entity that the DID document (ORG.JSON) is about. That is, it is the
      entity identified by the DID and described in the DID document.
    type: string
    pattern: "^did:orgid:0x[a-fA-F0-9]{64}([#]{1}[0-9a-zA-Z]+){0,1}$"
    example:
      "did:orgid:0x0000000000000000000000000000000000000000000000000000000000009121"
  TrustAssertionsReference:
    description: List of assertions (claims with proofs)
    type: array
    items:
      allOf:
        - $ref: '#/definitions/AssertsionReference'
  TrustCredentialsReference:
    description: List of credentials (provided and signed by third parties)
    type: array
    items:
      allOf:
        - $ref: '#/definitions/CredentialReference'
  AssertsionReference:
    description: Trust assertion
    type: object
    required:
      - claim
      - type
      - proof
    properties:
      claim:
        description: Claim subject. E.g. domain name or social account
        type: string
      type:
        description: "Proof type: (domain|dns|social)"
        type: string
        enum:
          - domain
          - dns
          - social
      proof:
        description: >-
          Proof of the claim: dns record, text file URI, or link to a post on
          facebook, linkedin, etc.
        type: string
  CredentialReference:
    description: List of verifiable credentials
    type: object
  ProofReference:
    description: >-
      A linked data proof is comprised of information about the proof,
      parameters required to verify it, and the proof value itself.
    type: object
  PublicKeyReference:
    description: >-
      Public keys are used for digital signatures, encryption and other
      cryptographic operations, which in turn are the basis for purposes such as
      authentication or establishing secure communication with service
      endpoints.
    type: object
    required:
      - id
      - type
      - controller
    properties:
      id:
        description: Identifies the owner of the corresponding private key
        $ref: '#/definitions/DIDReference'
      type:
        description: Public key type
        type: string
        enum:
          - RSA # RSA public key values MUST either be encoded as a JWK or be encoded in Privacy Enhanced Mail (PEM) format using the publicKeyPem property
          - ed25519 # Ed25519 public key values MUST either be encoded as a JWK or be encoded as the raw 32-byte public key value in Base58 Bitcoin format using the publicKeyBase58 property.
          - secp256k1 # Secp256k1 Koblitz public key values MUST either be encoded as a JWK or be encoded as the raw 33-byte public key value in Base58 Bitcoin format using the publicKeyBase58 property.
          - secp256r1 # Secp256r1 public key values MUST either be encoded as a JWK or be encoded as the raw 32-byte public key value encoded in Base58 Bitcoin format using the publicKeyBase58 property.
          - X25519 # Curve25519 (also known as X25519) public key values MUST either be encoded as a JWK or be encoded as the raw 32-byte public key value in Base58 Bitcoin format using the publicKeyBase58 property.
      controller:
        description: Identifies the controller of the corresponding private key
        $ref: '#/definitions/DIDReference'
      publicKeyPem:
        description: Public key value in Privacy Enhanced Mail (PEM) format
        type: string
      publicKeyBase58:
        description: Public key in value in Base58 Bitcoin format
        type: string
      note:
        description: Note about the private key purpose
    example: >-
      {
        "id": "did:orgid:0x0000000000000000000000000000000000000000000000000000000000009121#webserver",
        "type": "secp256k1",
        "controller": "did:orgid:0x0000000000000000000000000000000000000000000000000000000000009121",
        "publicKeyPem": "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE/7GpAW4+se9gZOFPtwk63ZhV1nX6M0UobMYO6FMAnON6vCbglyOaRzEltugkp6GrM8LZ6is0rMBMAXCvb9FH2g==",
        "note": "B2C Webserver Key"
      }
  ServiceReference:
    description: >-
      One of the primary purposes of ORG.JSON is to enable discovery of
      service endpoints (aka API URIs).
    type: object
    required:
      - id
      - type
      - serviceEndpoint
    properties:
      id:
        $ref: '#/definitions/DIDReference'
      type:
        description: Service endpoint type, e.g. "Google Maps" or "NDC"
        type: string
      serviceEndpoint:
        allOf:
          - description: >-
              JSON-LD object or a valid URI conforming to [RFC3986] and
              normalized according to the rules in section 6 of [RFC3986] and to
              any normalization rules in its applicable URI scheme
              specification.
          - oneOf:
              - $ref: '#/definitions/LinkedEndpointReference'
              - $ref: '#/definitions/LinkedDocumentEndpointReference'
    example: >-
      {
        "id": "did:orgid:0x0000000000000000000000000000000000000000000000000000000000009121#apiv1",
        "serviceEndpoint": "https://staging.glider.travel/api/v1",
        "type": "glider",
        "description": "Search and Book API",
        "docs": "https://staging.glider.travel/api/docs/"
      }
  PaymentReference:
    description: >-
      Public information about payment accounts of the organization.
    type: object
    required:
      - type
      - currency
    properties:
      type:
        description: The type of the payment record
        type: string
        enum:
          - crypto # Cryptocurrency. Cryptocurrency account address should be defined using `address` property
          - bank # Bank account. Bank accounts should be defined using `swift` and `iban` properties
          - simard # Simard Pay account
      currency:
        description: Currency of the account
        type: array
        items:
          $ref: "#/definitions/Currency"
      address:
        description: Cryptocurrency account address
        oneOf:
          - $ref: '#/definitions/CryptoETHAddress'
          - $ref: '#/definitions/CryptoBTCAddress'
      swift:
        description: SWIFT/BIC bank code according to ISO 9326
        $ref: '#/definitions/SwiftCode'
      iban:
        description: International Bank Account Number (IBAN) according to ISO 13616:1997
        $ref: '#/definitions/IbanCode'
    example: >-
      {
        "type": "crypto",
        "currency": [
          "btc"
        ],
        "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        "description": "General donation channel"
      }
  LinkedEndpointReference:
    description: >-
      Service endpoint URI conforming to [RFC3986] and normalized according to
      the rules in section 6 of [RFC3986] and to any normalization rules in its
      applicable URI scheme specification.
    type: string
    example:
      "https://staging.glider.travel/api/v1"
  LinkedDocumentEndpointReference:
    description: >-
      Service endpoint document conforming to JSON-LD object
      https://www.w3.org/TR/json-ld/
    type: object
    required:
      - '@context'
    properties:
      '@context':
        $ref: '#/definitions/ContextReference'
      type:
        description: Service endpoint type
        type: string
    example: >-
      {
        "@context": {
          "api": "https://own.api.service/schema.yaml#",
          "orgid": "https://github.com/windingtree/org.json-schema/blob/master/src/orgid-json-schema.yaml#",
          "type": "api:type",
          "b2b": "orgid:/definitions/LinkedEndpointReference",
          "admin": "orgid:/definitions/LinkedEndpointReference"
        },
        "type": "Booking Service",
        "b2b": "https://your.api.service/api/v1",
        "admin": "https://your.api.service/api/admin/v1"
      }
  IdentifierReference:
    description: 'A set of identifiers other than legal identifier'
    type: object
    required:
      - type
      - value
    properties:
      type:
        description: Identifier type (e.g. "IATA", "Trade License")
        type: string
      value:
        description: Identifier value
        type: string
    example:
      "IATA"
  AddressReference:
    description: Legal entity official address, physical location of a store, etc.
    type: object
    required:
      - country
      - locality
      - postalCode
      - streetAddress
    properties:
      country:
        description: ISO 3166-1 alpha-2 country code
        type: string
      subdivision:
        description: ISO 3166-2 country subdivision code1
        type: string
      locality:
        description: City or town
        type: string
      postalCode:
        description: Postal code
        type: string
      streetAddress:
        description: Street address
        type: string
      premise:
        description: Office, suite, apartment, etc.
        type: string
      gps:
        description: GPS coordinates
        type: string
      geocodes:
        description: "Address geocode: Open Location Code, what3words, etc."
        type: array
        items:
          allOf:
            - $ref: '#/definitions/GeoCodeReference'
    example: >-
      {
        "country": "CZ",
        "subdivision": "71",
        "locality": "Jihlava",
        "postalCode": "71354",
        "streetAddress": "3150 Main St.",
        "premise": "STE 100",
        "gps": "50.087070,14.417210",
        "geocodes": [
          {
            "type": "olc",
            "value": "3CQ9+F2 Prague"
          },
          {
            "type": "what3words",
            "value": "printers.torn.images"
          }
        ]
      }
  GeoCodeReference:
    description: Open Location Code (Plus Code) or what3words
    type: object
    required:
      - type
      - value
    properties:
      type:
        description: (olc|what3words)
        type: string
      value:
        description: E.g. "G6FX+QP" or "///compressor.verb.patch"
        type: string
    example: >-
      [
        {
          "type": "olc",
          "value": "3CQ9+F2 Prague"
        },
        {
          "type": "what3words",
          "value": "printers.torn.images"
        }
      ]
  LocationReference:
    description: >-
      Any location that business is related to the organization.
    type: object
    required:
      - name
      - address
      - contacts
    properties:
      name:
        description: Location name
        type: string
      description:
        description: Location description
        type: string
      address:
        $ref: '#/definitions/AddressReference'
      openingHours:
        $ref: '#/definitions/OpeningHoursReference'
      contacts:
        type: array
        items:
          allOf:
            - $ref: '#/definitions/ContactReference'
  OpeningHoursReference:
    description: Opening hours
    type: array
    items:
      allOf:
        - $ref: '#/definitions/OpeningHoursRangeReference'
  OpeningHoursRangeReference:
    description: Opening hours range
    type: object
    required:
      - weekDay
      - hours
    properties:
      weekDay:
        description: Three-letter week day, e.g. mon, tue, wed...
        type: string
      hours:
        description: >-
          Time range, e.g. 9:00-17:30 or 12:30-20:05
        type: string
        pattern: '^[0-9]{1,2}:[0-9]{1,2}-[0-9]{1,2}:[0-9]{1,2}$'
    example: >-
      {
        "weekDay": "fri",
        "hours": "10:00-16:00"
      }
  ContactReference:
    description: Contact reference
    type: object
    properties:
      function:
        description: >-
          Contact function: sales, support, accounting, etc.
        type: string
      name:
        description: Contact person or department name
        type: string
      phone:
        description: Phone number
        type: string
      email:
        description: Email
        type: string
        format: email
      messengers:
        description: Messenger accounts
        type: array
        items:
          allOf:
            - $ref: '#/definitions/MessengerReference'
      language:
        $ref: '#/definitions/LanguageReference'
    example: >-
      {
        "function": "Reception",
        "name": "John Smith",
        "phone": "+1234567890",
        "email": "email@spam.com",
        "messengers": [
          {
            "type": "whatsapp",
            "value": "+1234567890"
          },
          {
            "type": "kik",
            "value": "acme.ny.reception"
          }
        ]
      }
  MessengerReference:
    description: Messenger account information
    type: object
    required:
      - type
      - value
    properties:
      type:
        description: whatsapp, telegram, viber, wechat, messenger, line, etc.
        type: string
      value:
        description: Messenger account ID
        type: string
    example: >-
      [
        {
          "type": "whatsapp",
          "value": "+1234567890"
        },
        {
          "type": "kik",
          "value": "acme.ny.reception"
        }
      ]
  LanguageReference:
    description: Preferred languages
    type: array
    items:
      allOf:
        - $ref: '#/definitions/LanguageItemReference'
    example: >-
      [
        "en-US",
        "en-GB",
        "cs-CZ"
      ]
  LanguageItemReference:
    description: >-
      Language tag according to RFC 4646. Represented as combination of
      the ISO 639-1 language code and ISO 3166-1 alpha-2 country code.
      Examples: en-US, en-GB, cs-CZ, etc.
    type: string
    example:
      "en-US"
  MediaListReference:
    description: List of media files
    type: object
    properties:
      logo:
        description: Organization or unit logo
        type: string
        format: url
      images:
        description: List of images
        type: array
        items:
          allOf:
            - $ref: '#/definitions/MediaReference'
      videos:
        description: List of video files
        type: array
        items:
          allOf:
            - $ref: '#/definitions/MediaReference'
      documents:
        description: List of documents
        type: array
        items:
          allOf:
            - $ref: '#/definitions/MediaReference'
      others:
        description: Files other than images, video files or documents
        type: array
        items:
          allOf:
            - $ref: '#/definitions/MediaReference'
    example: >-
      {
        "logo": "https://imagehosting/hotel.jpg",
        "images": [
          {
            "description": "Hotel Lobby",
            "uri": "https://imagehosting/123456789.jpg",
            "thumbnail": "https://imagehosting/123456789-thumbnail.jpg"
          }
        ],
        "videos": [
          {
            "description": "Hotel Tour",
            "uri": "https://videohosting/hotel-tour.mp4",
            "cover": "https://imagehosting/hotel-tour-cover.jpg",
            "thumbnail": "https://imagehosting/hotel-tour-cover-thumbnail.jpg"
          }
        ],
        "documents": [
          {
            "description": "Hotel Presentation",
            "uri": "https://filehosting/hotel-presentation.pdf"
          }
        ]
      }
  MediaReference:
    description: Media file
    type: object
    required:
      - uri
    properties:
      description:
        description: File description
        type: string
      thumbnail:
        description: Thumbnail image
        type: string
        format: uri
      uri:
        description: Link to the media resource
        type: string
        format: uri
    example: >-
      {
        "description": "Hotel Tour",
        "uri": "https://videohosting/hotel-tour.mp4",
        "cover": "https://imagehosting/hotel-tour-cover.jpg",
        "thumbnail": "https://imagehosting/hotel-tour-cover-thumbnail.jpg"
      }
  Currency:
    description: Currency code
    type: string
    pattern: "^[a-zA-Z]{2,}$"
    example:
      "EUR"
  CryptoETHAddress:
    description: Ethereum address
    type: string
    pattern: "^0x[a-fA-F0-9]{40}$"
    example:
      "0x0000000000000000000000000000000000099333"
  CryptoBTCAddress:
    description: Bitcoin address
    type: string
    pattern: "^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$"
    example:
      "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
  SwiftCode:
    description: SWIFT/BIC bank code according to ISO 9326
    type: string
    pattern: "^[a-zA-Z]{4}[ -]{0,1}[a-zA-Z]{2}[ -]{0,1}[a-zA-Z0-9]{2}[ -]{0,1}[XXX0-9]{0,3}$"
    example:
      "UBSWUS33CHI"
  IbanCode:
    description: International Bank Account Number (IBAN) according to ISO 13616:1997
    type: string
    pattern: "^([A-Z]{2}[ -]?[0-9]{2})(?=(?:[ -]?[A-Z0-9]){9,30}$)((?:[ -]?[A-Z0-9]{3,5}){2,7})([ -]?[A-Z0-9]{1,3})?$"
    example:
      "DE91100000000123456789"
"""
