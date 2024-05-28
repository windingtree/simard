"""
TADC, used to gather up information and generate the XML file.
Based on a fixed routine the report is send over to AMEX.
"""

from .message import Message
from .context import Context


class TADC(object):

    @staticmethod
    def xml(pretty=False):
        context = Context()
        tadc_document = Message(context).build_document()

        if pretty:
            return tadc_document.toprettyxml()
        else:
            return tadc_document.toxml()
