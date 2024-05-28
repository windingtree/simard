import logging

from flask import Flask

# Create the webserver
app = Flask(
    __name__,
    static_url_path='',
    static_folder='../public'
)

# Add the configuration
app.config.from_pyfile('settings.py')
app.logger.setLevel(level=logging.INFO)
app.config['WTF_CSRF_ENABLED'] = True

from simard import routes
