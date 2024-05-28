# Simard Pay

## Dependencies

The following services needs to be available and configured in the `.env` file for a local run, or in the `now secrets` for a Vercel deployment.

* MongoDB
  * `DATABASE_URI`: The MongoDB URI
* Redis:
  * `REDIS_URL`: The Redis instance URI
* Elastic Search
  * `ELASTIC_SEARCH_URL`: The Elastic Search instance URI
* Infura
  * `INFURA_WSS_ENDPOINT`: The websocket URI, eg: `wss://ropsten.infura.io/ws/v3`
  * `INFURA_PROJECT_ID`: The INFURA Project ID
* Transferwise
  * `TRANSFERWISE_API_ENDPOINT`: The Transferwise Base URL
    * For the Sandbox: `https://api.sandbox.transferwise.tech`
    * For the Live: `https://api.transferwise.com`
  * `TRANSFERWISE_API_TOKEN`: The Transferwise token created in the settings section
  * `TRANSFERWISE_PROFILE_ID`: The Business profile ID. See the _scripts/transferwise_profiles.sh_ to retrieve it.

## Installation

```shell
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
```

## Running Unit tests

After having all environment variables, call:

```shell
python -m unittest -v test/test_*.py
```

## Running with Flask

```shell
source env/bin/activate
flask run
```

## Running locally with Zeit Now

```shell
now dev
```
