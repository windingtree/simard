from flask import request, jsonify, g, redirect, make_response, Response
from flask_httpauth import HTTPTokenAuth
from flask_swagger_ui import get_swaggerui_blueprint
from werkzeug.exceptions import HTTPException
from simard import app
from simard.amex import Amex
from simard.balance_manager import BalanceManager
from simard.oauth_manager import OAuthManager
from simard.account_manager import AccountManager
from model.exception import SimardException
from datetime import datetime, timedelta
from simard.stripe_manager import StripeManager
from simard.circle_manager import CircleManager
from simard.quote_manager import QuoteManager
from simard.rate_manager import RateManager
from simard.token import CardData
from simard.token_manager import TokenManager
from tadc import TADC
import traceback
import logging
import json
from simard.settings import ENABLE_SIMULATED_DEPOSIT, TADC_REPORT_API_ENABLED, OVERRIDE_AMEX_TOKEN
from simard.intent import Intent

# Initialize the application
auth = HTTPTokenAuth()


@app.before_request
def prepare_request():
    g.start_time = datetime.now()


@app.after_request
def log_response(response):
    """
    Log an event for all JSON-Based responses
    """

    if response.is_json:
        # Get the error message
        message = "OK"
        json = response.get_json(force=True, silent=True)
        if json and ("message" in json):
            message = json["message"]

        # Get the elpased time
        if hasattr(g, "start_time"):
            elapsed = round(
                (datetime.now() - g.start_time) / timedelta(microseconds=1000)
            )
        else:
            elapsed = None

        # Log the HTTP transaction
        # es_handler.log_http_transaction(response.status, message, elapsed)

        # Flush all events
        # es_handler.flush()

    return response


@app.errorhandler(Exception)
def handle_unhandled_exception(e):
    # Log the exception
    # es_handler.log_exception(e)
    logging.error(str(e))
    traceback.print_exc()

    # pass through HTTP errors
    if isinstance(e, HTTPException):
        return e

    # Reply a generic error
    return make_response(
        jsonify({
            "message": "Server Error: Please contact support",
        }), 500
    )


@app.errorhandler(HTTPException)
def handle_http_exception(e):
    # Log the exception
    # es_handler.log_exception(e)
    logging.error(str(e))

    # Return a JSON formatted message
    return make_response(jsonify({"message": e.description}), e.code)


# Handle explicit authentication rejection
@auth.error_handler
def handle_auth_error():
    raise SimardException("Unable to Authenticate", 500)


# Token verification callback
@auth.verify_token
def verify_token(jwt_token):
    # Check if the token is present
    if jwt_token in [None, ""]:
        raise SimardException("Authentication Bearer missing", 403)

    # Try to validate it
    try:
        g.orgid, g.agent = OAuthManager.validate_token(jwt_token)
    except SimardException as e:
        raise SimardException(
            "Authentication refused: %s | Token: %s"
            % (e.description, jwt_token),
            403,
        ) from e

    return True


# Redirect the route to the docs directory
@app.route("/")
def root():
    return redirect("/api/docs/")


@app.route("/api/docs/simard.yaml")
def swagger():
    return app.send_static_file("simard.yaml")


@app.route("/oauth/authorize")
def oauth():
    return app.send_static_file("authorize.html")


# Define the Swagger UI
SWAGGER_URL = "/api/docs"
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL, "/api/docs/simard.yaml", config={"app_name": "Simard"}
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

@app.route("/api/v1/ping", methods=["GET"])
def ping():
    return jsonify({'message', 'pong'})


@app.route("/api/v1/balances/depositInstructions", methods=["GET"])
@auth.login_required
def deposit_instructions():
    with open("public/depositInstructions.json") as f:
        deposit_instructions = json.load(fp=f)

    return jsonify(deposit_instructions)


# Route for accounts management
@app.route("/api/v1/accounts", methods=["GET", "POST"])
@auth.login_required
def accounts():
    # Handle the POST request
    if request.method == "POST":

        # Check input fields
        parameters = request.get_json(True)
        SimardException.check_mandatory_keys(
            mandatory_keys=["currency", "iban"], received_keys=parameters.keys()
        )

        # Create the account
        account_uuid = AccountManager.create_account(
            orgid=g.orgid,
            agent=g.agent,
            iban=parameters["iban"],
            currency=parameters["currency"],
        )

        # Format the reply as JSON
        return jsonify(accountId=account_uuid)

    # Handle the GET request
    elif request.method == "GET":
        # Get the accounts
        accounts = AccountManager.get_accounts(g.orgid)

        # Format the JSON reply
        accounts_dict = {}
        if accounts is not None:
            for account in accounts:
                accounts_dict[account.uuid] = {
                    "currency": account.currency,
                    "iban": account.iban,
                }

        return jsonify(accounts_dict)


@app.route("/api/v1/accounts/<account_uuid>", methods=["GET", "POST", "DELETE"])
@auth.login_required
def accounts_uuid(account_uuid):
    # Handle the GET request
    if request.method == "GET":
        account = AccountManager.get_account(g.orgid, account_uuid)
        return jsonify({"currency": account.currency, "iban": account.iban})

    # Handle the POST request
    elif request.method == "POST":

        # Check input fields
        parameters = request.get_json(True)
        SimardException.check_mandatory_keys(
            mandatory_keys=["currency", "iban"], received_keys=parameters.keys()
        )

        # Build the account
        AccountManager.update_account(
            orgid=g.orgid,
            agent=g.agent,
            account_uuid=account_uuid,
            currency=parameters["currency"],
            iban=parameters["iban"],
        )
        return jsonify(accountId=account_uuid)

    # Handle the DELETE request
    elif request.method == "DELETE":
        AccountManager.delete_account(g.orgid, account_uuid)
        return jsonify({})


@app.route("/api/v1/balances", methods=["GET"])
@auth.login_required
def balances():
    # Get the balance
    if request.method == "GET":

        # Retrieve balances from the DB
        balances = BalanceManager.get_balances(g.orgid)
        balance_dic = {}

        for balance in balances:
            total = BalanceManager.format_amount(
                balance.total, balance.currency
            )
            reserved = BalanceManager.format_amount(
                balance.reserved, balance.currency
            )
            available = BalanceManager.format_amount(
                balance.available, balance.currency
            )

            balance_dic[balance.currency] = {
                "total": str(total),
                "reserved": str(reserved),
                "available": str(available),
            }
        return jsonify(balance_dic)


@app.route("/api/v1/balances/guarantees", methods=["POST"])
@auth.login_required
def create_guarantee():
    # Check all parameters are present
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=["creditorOrgId", "currency", "amount", "expiration"],
        received_keys=parameters.keys(),
    )

    # Create the guarantee
    guarantee_uuid = BalanceManager.add_guarantee(
        initiating_orgid=g.orgid,
        initiating_agent=g.agent,
        receiving_orgid=parameters["creditorOrgId"],
        currency=parameters["currency"],
        amount=parameters["amount"],
        expiration=parameters["expiration"],
    )
    return jsonify({"guaranteeId": guarantee_uuid})


@app.route(
    "/api/v1/balances/guarantees/<guarantee_id>", methods=["GET", "DELETE"]
)
@auth.login_required
def guarantee(guarantee_id):
    # Process the GET request
    if request.method == "GET":
        # Retrieve the guarantee
        guarantee = BalanceManager.get_guarantee(
            orgid=g.orgid, guarantee_id=guarantee_id
        )

        # Provide the answer
        return jsonify(
            {
                "currency": guarantee.currency,
                "amount": str(guarantee.amount),
                "creditorOrgId": guarantee.beneficiary,
                "debtorOrgId": guarantee.initiator,
                "expiration": guarantee.expiration.isoformat()[:-6] + "Z",
            }
        )

    # Process the DELETE request
    elif request.method == "DELETE":
        BalanceManager.cancel_guarantee(
            orgid=g.orgid, guarantee_id=guarantee_id
        )
        return {}


@app.route("/api/v1/balances/guarantees/<guarantee_id>/claim", methods=["POST"])
@auth.login_required
def claim_guarantee(guarantee_id):
    # Get input data
    settlement_uuid = BalanceManager.claim_guarantee(
        claiming_orgid=g.orgid,
        claiming_agent=g.agent,
        guarantee_id=guarantee_id,
    )
    return jsonify({"settlementId": settlement_uuid})


@app.route(
    "/api/v1/balances/guarantees/<guarantee_id>/claimWithCard", methods=["POST"]
)
@auth.login_required
def claim_guarantee_with_card(guarantee_id):
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=["expiration"], received_keys=parameters.keys()
    )

    # Create the virtual card
    card, settlement_uuid = BalanceManager.claim_guarantee_with_card(
        claiming_orgid=g.orgid,
        claiming_agent=g.agent,
        guarantee_id=guarantee_id,
        card_expiration=parameters["expiration"],
    )

    # Return the card details
    return jsonify(
        {
            "settlementId": settlement_uuid,
            "card": {
                "id": card.guarantee_id,
                "brand": card.brand,
                "accountNumber": card.account_number,
                "expiryMonth": card.expiration_month,
                "expiryYear": card.expiration_year,
                "cvv": card.cvv,
                "type": card.card_type,
            },
        }
    )


@app.route("/api/v1/balances/<currency>/withdraw", methods=["POST"])
@auth.login_required
def balance_withdraw(currency):
    # Perform the withdrawal
    withdraw_uuid = BalanceManager.withdraw(
        orgid=g.orgid, agent=g.agent, currency=currency
    )
    return jsonify({"settlementId": withdraw_uuid})


@app.route("/api/v1/balances/deposits", methods=["POST"])
@auth.login_required
def add_blockchain_deposit():
    # Check parameters
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=["instrument", "chain", "transactionHash"],
        received_keys=parameters.keys(),
    )

    # Retrieve the creditor balance
    deposit_uuid = BalanceManager.add_blockchain_deposit(
        orgid=g.orgid,
        agent=g.agent,
        instrument=parameters["instrument"],
        chain=parameters["chain"],
        transaction_hash=parameters["transactionHash"],
        quote_uuid=parameters.get("quoteId", None),
    )
    return jsonify({"settlementId": deposit_uuid})


@app.route("/api/v1/balances/simulateDeposit", methods=["POST"])
@auth.login_required
def balance_credit():
    # Disable in production
    if not ENABLE_SIMULATED_DEPOSIT:
        return make_response(
            jsonify(
                {
                    "message": "Simulate Deposit is a TEST ONLY method, please make a live bank deposit"
                }
            ),
            400,
        )

    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=["currency", "amount"], received_keys=parameters.keys()
    )

    # Retrieve the creditor balance
    credit_uuid = BalanceManager.add_deposit(
        orgid=g.orgid,
        agent=g.agent,
        currency=parameters["currency"],
        amount=parameters["amount"],
    )
    return jsonify({"settlementId": credit_uuid})


@app.route("/api/v1/balances/stripeCredit", methods=["POST"])
def stripe_credit():
    # Process the event
    credit_uuid = StripeManager.process_webook(request)
    return jsonify({"settlementId": credit_uuid})


@app.route("/api/v1/balances/circleNotification", methods=["POST"])
def circle_notification():
    # Process the event
    payload = request.get_json(True)
    credit_uuid = CircleManager.process_webook(payload)
    logging.warn("Circle Notification: %s" % str(credit_uuid))
    return jsonify({"settlementId": credit_uuid})


@app.route("/api/v1/balances/swap", methods=["POST"])
@auth.login_required
def swap_balances():
    # Process the event
    payload = request.get_json(True)
    keys = []
    if isinstance(payload, dict):
        keys = payload.keys()

    SimardException.check_mandatory_keys(
        mandatory_keys=["quotes"], received_keys=keys
    )

    s, t = BalanceManager.swap(g.orgid, g.agent, payload["quotes"])
    return jsonify({"sources": s, "targets": t})


@app.route("/api/v1/cards", methods=["POST"])
@auth.login_required
def generate_card():
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=["currency", "amount", "expiration"],
        received_keys=parameters.keys(),
    )

    # Create the virtual card
    virtual_card = BalanceManager.generate_virtual_card(
        orgid=g.orgid,
        agent=g.agent,
        currency=parameters["currency"],
        amount=parameters["amount"],
        expiration=parameters["expiration"],
    )

    # Return the card details
    return jsonify(
        {
            "id": virtual_card.guarantee_id,
            "accountNumber": virtual_card.account_number,
            "cvv": virtual_card.cvv,
            "expiryMonth": virtual_card.expiration_month,
            "expiryYear": virtual_card.expiration_year,
            "type": virtual_card.card_type,
            "brand": virtual_card.brand,
        }
    )


@app.route("/api/v1/cards/<card_id>", methods=["DELETE"])
@auth.login_required
def cancel_card(card_id):
    BalanceManager.cancel_virtual_card(
        orgid=g.orgid, agent=g.agent, guarantee_id=card_id
    )
    return jsonify({})


@app.route("/api/v1/quotes", methods=["POST"])
@auth.login_required
def quotes():
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=["sourceCurrency", "targetCurrency"],
        received_keys=parameters.keys(),
    )
    quote = QuoteManager.create_quote(
        orgid=g.orgid,
        agent=g.agent,
        source_currency=parameters.get("sourceCurrency"),
        target_currency=parameters.get("targetCurrency"),
        source_amount=parameters.get("sourceAmount", None),
        target_amount=parameters.get("targetAmount", None),
    )
    return jsonify(
        {
            "quoteId": quote.uuid,
            "sourceCurrency": quote.source_currency,
            "sourceAmount": str(quote.source_amount),
            "targetCurrency": quote.target_currency,
            "targetAmount": str(quote.target_amount),
            "rate": str(quote.rate),
        }
    )


@app.route("/api/v1/quotes/<quote_uuid>", methods=["GET"])
@auth.login_required
def quote_by_uuid(quote_uuid):
    quote = QuoteManager.get_quote(
        orgid=g.orgid,
        agent=g.agent,
        quote_uuid=quote_uuid,
    )
    return jsonify(
        {
            "quoteId": quote.uuid,
            "sourceCurrency": quote.source_currency,
            "sourceAmount": str(quote.source_amount),
            "targetCurrency": quote.target_currency,
            "targetAmount": str(quote.target_amount),
            "rate": str(quote.rate),
        }
    )


@app.route("/api/v1/rates", methods=["GET"])
@auth.login_required
def get_rate():
    rate = RateManager.get_rate(
        orgid=g.orgid,
        agent=g.agent,
        source_currency=request.args.get("source"),
        target_currency=request.args.get("target"),
    )

    return jsonify(
        {
            "rate": str(rate),
        }
    )


@app.route("/api/v1/tokens/<token_uuid>", methods=["GET", "DELETE"])
@auth.login_required
def getdel_token(token_uuid):
    if request.method == "GET":
        token = TokenManager.retrieve_token(
            orgid=g.orgid, agent=g.agent, token_uuid=token_uuid
        )

        return jsonify(token.json_dict())

    if request.method == "DELETE":
        TokenManager.delete_token(
            orgid=g.orgid, agent=g.agent, token_uuid=token_uuid
        )
        return jsonify({})


@app.route("/api/v1/tokens", methods=["POST"])
@auth.login_required
def post_token():
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=[
            "receiverOrgId",
            "secureFieldTransactionId",
            "expiryMonth",
            "expiryYear",
            "cardholderName",
            "billingAddress",
        ],
        received_keys=parameters.keys(),
    )

    token = TokenManager.create_token(
        creator_orgid=g.orgid,
        receiver_orgid=parameters["receiverOrgId"],
        agent=g.agent,
        secure_field_transaction_id=parameters["secureFieldTransactionId"],
        expiry_month=parameters["expiryMonth"],
        expiry_year=parameters["expiryYear"],
        cardholder_name=parameters["cardholderName"],
        billing_address_dict=parameters["billingAddress"],
    )

    return jsonify(token.json_dict())


@app.route("/api/v1/tokens/travel-account", methods=["POST"])
@auth.login_required
def travel_account():
    parameters = request.get_json(True)
    SimardException.check_mandatory_keys(
        mandatory_keys=[
            "currency",
            "amount",
            "receiverOrgId",
            "customerReferences",
        ],
        received_keys=parameters.keys(),
    )

    token = TokenManager.create_travel_account_token(
        creator_orgid=g.orgid,
        agent=g.agent,
        receiver_orgid=parameters["receiverOrgId"],
        currency=parameters["currency"],
        amount=parameters["amount"],
        customer_references=parameters["customerReferences"],
    )

    return jsonify(token.json_dict())


@app.route(
    "/api/v1/tokens/<token_uuid>/travel-components", methods=["POST", "GET"]
)
@auth.login_required
def postget_travel_components(token_uuid):
    if request.method == "POST":
        travel_components = request.get_json(True)

        TokenManager.add_travel_components(
            orgid=g.orgid,
            agent=g.agent,
            token_uuid=token_uuid,
            travel_components=travel_components,
        )

        token = TokenManager.retrieve_token(orgid=g.orgid,
                                                    agent=g.agent,
                                                    token_uuid=token_uuid)
        components = TokenManager.get_travel_components(
            orgid=g.orgid, agent=g.agent, token_uuid=token_uuid
        )
        if token.is_amex_token:
            card_data: CardData = token.card_data
            token_number = card_data.cc
            if OVERRIDE_AMEX_TOKEN:
                # in test mode, token.card_data contains overriden card data so we need to get the actual token data from 'amex_token_data'
                card_data = token.amex_token_data
                token_number = card_data['aliasCC']

            # this is amex token, so we need to update token with travel components (PNR locator, eTicket, itinerary
            Amex.update_travel_account_with_travel_components(token_number,  token.travel_components, None)


    return jsonify(
        TokenManager.get_travel_components(
            orgid=g.orgid, agent=g.agent, token_uuid=token_uuid
        )
    )

@app.route("/api/v1/intents", methods=['POST'])
@auth.login_required
def post_intent():
    intent = Intent(request.get_json(True))
    intent.initiate_three_domain_secure_secure_fields()
    intent.store()
    return jsonify({
        'secureFieldTransactionId': intent.transaction_id
    })

@app.route("/api/v1/intents/<id>", methods=['GET'])
@auth.login_required
def get_intent(id):
    intent = Intent.from_storage(id)
    intent.validate_three_domain_secure_secure_fields()
    return jsonify(intent.card)

@app.route("/api/v1/tadc", methods=["GET"])
def generate_tadc_report():
    if TADC_REPORT_API_ENABLED:
        return Response(response=TADC.xml(), status=200, mimetype="text/xml")
    else:
        return jsonify(
            {"status": "Error", "message": "TADC report generation is disabled"}
        )
