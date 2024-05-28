from xml.dom.minidom import getDOMImplementation
from datetime import datetime
from .context import Context
from .travel_batch_manager import TravelBatchManager
from .message_trailer import MessageTrailer
from .text_tag import TextTag


class MsgSeqNbr(TextTag):
    def __init__(self, message_sequence_number):
        super().__init__(
            "MsgSeqNbr", str(message_sequence_number).zfill(9)
        )


class CreateDt(TextTag):
    def __init__(self, create_datetime: datetime):
        super().__init__("CreateDt", create_datetime.strftime("%Y%m%d"))


class CreateTm(TextTag):
    def __init__(self, create_datetime: datetime):
        super().__init__("CreateTm", create_datetime.strftime("%H%M%S"))


class Message(object):
    def __init__(self, context: Context):
        # Get the travel batches in this context
        travel_batches = TravelBatchManager.get_travel_batches(context)

        # Add identifier tags
        self.tags = [
            TextTag("VersNbr", "201000001"),
            TextTag("SubmrId", "XMLSIMA153"),
            MsgSeqNbr(context.message_sequence_number),
            CreateDt(context.current_cutoff_datetime),
            CreateTm(context.current_cutoff_datetime),
        ]

        # Add the Travel Batches
        self.tags.extend(travel_batches)

        # Add the currency totals
        currency_totals = []
        for travel_batch in travel_batches:
            currency_totals.append(travel_batch.currency_total)
        self.tags.append(MessageTrailer(len(travel_batches), currency_totals))

    def build_document(self):
        dom_implementation = getDOMImplementation()
        document = dom_implementation.createDocument(None, "Message", None)
        top_element = document.documentElement
        for tag in self.tags:
            top_element.appendChild(tag.build_node(document))
        return document
